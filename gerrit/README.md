# Gerrit integration for CLA Manager

The `gerrit-hook` script runs as a synchronous gerrit hook, and is renamed to
`commit-received` or `ref-update`:

https://gerrit.googlesource.com/plugins/hooks/+/master/src/main/resources/Documentation/hooks.md

When run, it queries the CLA server using the email address of the uploader as
a parameter, which returns a JSON blob that looks like:

```json
{"status":"success|failure|error","message":"message text"}
```

If the CLA is signed, it exits with success.

If the CLA is not signed, it returns the message provided by the server which
Gerrit will send to the user.

It also handles common error cases (can't contact server, invalid response,
etc.)

## Deploying the gerrit-hook script

1. Modify the `CLA_MANAGER_URL`, `CLA_MANAGER_USERNAME`, and
   `CLA_MANAGER_PASSWORD` near the top of the `gerrit-hook` file to match the
   settings used with your cla-manager deployment.

2. Test that settings are correct by running the command:

        ./gerrit-hook --uploader "Foo Bar <foo@bar.com>" --debug

   Test with email addresses that pass (has signed) and fail (hasn't signed)
   cases, checking the exit code (`echo $?`) after each command.

3. Change `ENFORCING` to `False` in the hook script - this makes the script
   always exit with success.

4. Copy to your gerrit instance (default location is in the `$site_path/hooks`
   directory), and change the name of the file to be `commit-received` (or
   other names, see the gerrit hook docs), and make the script executable.

   Repeat the tests in #2 to ensure the script works correctly on the gerrit
   server.

   Usually the defaults are fine, but if you have an unusual gerrit deployment
   you may need to modify the gerrit hook configuration:
   https://gerrit.googlesource.com/plugins/hooks/+/master/src/main/resources/Documentation/config.md

   You can enable additional logging of hooks by changing the log level:
   `ssh -p 29418 user@gerrit.example gerrit logging set-level DEBUG com.googlesource.gerrit.plugins.hooks`

5. Create and submit a few test commits, checking with users that have both
   signed and not signed the CLA using cla-manager.  Check that it:

   a. Doesn't send a message when user has signed a CLA

   b. Sends a message when the CLA hasn't been signed

6. Change `ENFORCING` to `True` in the hook script.

## Development and Testing

Tested on Python 3.6, which is used in CentOS 7 (used on ONF Gerrit instances).

Only built-in Python libraries are used, to eliminate external dependencies.

To test changes, run `tox` in this directory. This will lint the code, run a
full set of unit tests, and output coverage information.
