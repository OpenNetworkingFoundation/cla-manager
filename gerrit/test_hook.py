# Copyright 2020-present Open Networking Foundation
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# unit tests for gerrit hook

from __future__ import absolute_import

import importlib.machinery
import importlib.util
import logging
import os.path
import re
import sys
import unittest
import urllib.request  # noqa: F401
import urllib.error
from unittest.mock import patch, MagicMock

# load the script as a module, hard because it doesn't end in .py
test_dir = os.path.dirname(os.path.realpath(__file__))
mod_path = os.path.abspath(os.path.join(test_dir, "gerrit-hook"))
mod_name = "gerrithook"

importlib.util.spec_from_file_location(mod_name, mod_path)
spec = importlib.util.spec_from_loader(
            mod_name,
            importlib.machinery.SourceFileLoader(mod_name, mod_path)
        )
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
sys.modules[mod_name] = module
import gerrithook  # noqa: E402

# set logging, using same logger as script
logger = logging.getLogger('gerrit-hook')
logger.setLevel(logging.DEBUG)


class gerrithook_test(unittest.TestCase):

    def test_uploader_email_good1(self):
        '''
        Pass with email that has fullname prefix as input
        '''
        input_addr = "Foo Bar <foo@bar.baz>"

        output = gerrithook.uploader_email(input_addr)
        self.assertEqual(output, "foo@bar.baz")

    def test_uploader_email_good2(self):
        '''
        Pass with bare email address as input
        '''
        input_addr = "foo@bar.baz"

        output = gerrithook.uploader_email(input_addr)
        self.assertEqual(output, "foo@bar.baz")

    def test_uploader_email_invalid(self):
        '''
        Fail when non-email as input
        '''
        input_addr = "not an email address"

        with self.assertRaises(SystemExit) as cm:
            gerrithook.uploader_email(input_addr)

        # check exit code depening on ENFORCING value
        if gerrithook.ENFORCING:
            self.assertEqual(cm.exception.code, 1)
        else:
            self.assertEqual(cm.exception.code, 0)

    @patch('urllib.request.urlopen')
    def test_request_cla_status_pass(self, mock_urlopen):
        '''
        Pass when CLA signed
        '''
        cla_url = "https://cla-manager.example/check-cla"
        addr = "foo@bar.com"

        cm = MagicMock()
        cm.getcode.return_value = 200
        cm.read.return_value = '{ "status": "success", "message": "foo@bar.com signed the CLA" }'
        cm.__enter__.return_value = cm
        mock_urlopen.return_value = cm
        (status, message) = gerrithook.request_cla_status(cla_url, addr)
        self.assertTrue(status)

    @patch('urllib.request.urlopen')
    def test_request_cla_status_fail(self, mock_urlopen):
        '''
        Fail when CLA not signed
        '''
        cla_url = "https://cla-manager.example/check-cla"
        addr = "foo@bar.com"

        cm = MagicMock()
        cm.getcode.return_value = 200
        cm.read.return_value = '{ "status": "failure", "message": "foo@bar.com needs to sign the CLA" }'
        cm.__enter__.return_value = cm
        mock_urlopen.return_value = cm

        (status, message) = gerrithook.request_cla_status(cla_url, addr)
        self.assertFalse(status)
        self.assertEqual(message, "foo@bar.com needs to sign the CLA")

    @patch('urllib.request.urlopen')
    def test_request_cla_status_http_error(self, mock_urlopen):
        '''
        Fail on HTTP error
        '''
        cla_url = "https://cla-manager.example/check-cla"
        addr = "foo@bar.com"

        mock_urlopen.side_effect = urllib.error.HTTPError(cla_url, 500, 'Internal Error', {}, None)

        (status, message) = gerrithook.request_cla_status(cla_url, addr)
        self.assertFalse(status)
        self.assertTrue(re.fullmatch(r'^Server encountered an HTTPError at URL.*$', message))

    @patch('urllib.request.urlopen')
    def test_request_cla_status_URL_error(self, mock_urlopen):
        '''
        Fail on URL error
        '''
        cla_url = "https://cla-manager.example/check-cla"
        addr = "foo@bar.com"

        mock_urlopen.side_effect = urllib.error.URLError(404, 'Not Found')

        (status, message) = gerrithook.request_cla_status(cla_url, addr)
        self.assertFalse(status)
        self.assertTrue(re.fullmatch(r'^An URLError occurred at URL.*$', message))

    def test_check_cla_response_pass(self):
        '''
        Pass CLA with positive JSON input
        '''
        jsondata = '{ "status": "success", "message": "foo@bar.com signed the CLA" }'

        (status, message) = gerrithook.check_cla_response(jsondata)
        self.assertTrue(status)

    def test_check_cla_response_fail(self):
        '''
        Fail CLA using negative JSON input
        '''
        jsondata = '{ "status": "failure", "message": "foo@bar.com needs to sign the CLA" }'

        (status, message) = gerrithook.check_cla_response(jsondata)
        self.assertFalse(status)
        self.assertEqual(message, "foo@bar.com needs to sign the CLA")

    def test_check_cla_response_error(self):
        '''
        Error on CLA backend
        '''
        jsondata = '{ "status": "error", "message": "An error has occurred" }'

        (status, message) = gerrithook.check_cla_response(jsondata)
        self.assertFalse(status)
        self.assertEqual(message, "An error has occurred")

    def test_check_cla_response_invalid_json1(self):
        '''
        Fail with non-JSON as input
        '''
        jsondata = "invalid"

        (status, message) = gerrithook.check_cla_response(jsondata)
        self.assertFalse(status)
        self.assertEqual(message, "Unable to decode JSON")

    def test_check_cla_response_invalid_json2(self):
        '''
        Fail when JSON that doesn't contain correct keys
        '''
        jsondata = '{ "status": "success" }'

        (status, message) = gerrithook.check_cla_response(jsondata)
        self.assertFalse(status)
        self.assertEqual(message, "JSON didn't contain keys: 'status' and 'message'")

    def test_output_status_pass(self):
        '''
        Pass when CLA is signed
        '''
        with self.assertRaises(SystemExit) as cm:
            gerrithook.output_status(True, "")

        self.assertEqual(cm.exception.code, 0)

    def test_output_status_fail(self):
        '''
        Fail when CLA is not signed
        '''
        with self.assertRaises(SystemExit) as cm:
            gerrithook.output_status(False, "foo@bar.com needs to sign the CLA")

        # check exit code depening on ENFORCING value
        if gerrithook.ENFORCING:
            self.assertEqual(cm.exception.code, 1)
        else:
            self.assertEqual(cm.exception.code, 0)

    def test_format_terminal_message(self):
        '''
        Message shown on terminal should be wrapped at 80 characters
        (including `remote: ` prefix)
        '''
        lines = gerrithook.format_terminal_message("#"*100).split('\n')

        self.assertEqual(len(lines), 2)
        self.assertEqual(len(lines[0]) + len('remote: '), 80)
