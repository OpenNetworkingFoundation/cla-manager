# Gerrit integration for CLA Manager

The `ref-update` script runs as a gerrit hooks:

https://gerrit.googlesource.com/plugins/hooks/+/master/src/main/resources/Documentation/hooks.md

When run, it queries the CLA server using the email address as a parameter,
which returns a JSON blob that looks like:

```json
{"status":"success|failure","message":"message text"}
```

If the CLA is signed, it exits with success.

If the CLA is not signed, it returns the message provided by the server which
Gerrit will send to the user.

It also handles common error cases (can't contact server, invalid response,
etc.)

## Deploying the ref-update script

1. Modify the `CLA_MANAGER_URL` near the top of the `ref-updated` file to match
   your cla-manager deployment.

2. Test that settings are correct by running the command:

        ./ref-update --uploader "Foo Bar (foo@bar.com)" --debug

   Test with email addresses that pass (has signed) and fail (hasn't signed)
   cases, checking the exit code (`echo $?`) after each command.

3. Change `ENFORCING` to `False` in the `ref-updated` file - this makes the
   script always exit with success.

4. Copy to your gerrit instance (default location is in the `$site_path/hooks`
   directory), and modify the gerrit configuration to use it, if needed:
   https://gerrit.googlesource.com/plugins/hooks/+/master/src/main/resources/Documentation/config.md

5. Create and submit a few tests commits, checking with users that have both
   signed and not signed the CLA using cla-manager.  Check that it:

   a. Doesn't send a message when user has signed a CLA

   b. Sends a message when the CLA hasn't been signed

6. Change `ENFORCING` to `True` in the `ref-updated` file.

## Development and Testing

Tested on Python 3.6, which is used in CentOS 7 (used on ONF Gerrit instances).

Only built-in Python libraries are used, to eliminate external dependencies.

To test changes, run `tox` in this directory. This will lint the code, run a
full set of unit tests, and output coverage information.
