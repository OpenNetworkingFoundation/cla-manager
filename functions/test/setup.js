global.console = {
  // we are disabling all the log calls in the tests to keep the otuput readable
  log: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn()

  // if you need to enable some for debugging purposes uncomment the following lines
  // log: console.log,
  // warn: console.warn,
  // info: console.info,
  // debug: console.debug,
  // error: console.error,
}
