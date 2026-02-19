/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/dropper.json`.
 */
export type Dropper = {
  "address": "EiVbEHAdg78A39n29nWnHZjDinxFeMwFqR8acFtLpKj6",
  "metadata": {
    "name": "dropper",
    "version": "0.1.0",
    "spec": "0.1.0"
  },
  "instructions": [
    {
      "name": "transferLamports",
      "discriminator": [
        62,
        53,
        201,
        68,
        102,
        134,
        83,
        103
      ],
      "accounts": [
        {
          "name": "from",
          "writable": true,
          "signer": true
        },
        {
          "name": "to",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ]
};
