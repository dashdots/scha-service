/**
 * Process exit codes enumeration
 *
 * @readonly
 * @enum {number}
 */
const ExitCodes = {
  FORCE_EXIT:103,
  CLEANUP_FAIL:102,
  TIMEOUT: 101,
  FATAL:100,
  BRAKED: 1,
  SUCCESS: 0,
  RECYCLING: -1,
};

export default ExitCodes;