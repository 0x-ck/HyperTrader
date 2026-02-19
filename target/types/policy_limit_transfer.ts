/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/policy_limit_transfer.json`.
 */
export type PolicyLimitTransfer = {
  "address": "J4JzdiMJt2YJubjvkndS2KPwJC7MiLMopZLsYGKBMYfG",
  "metadata": {
    "name": "policyLimitTransfer",
    "version": "0.1.0",
    "spec": "0.1.0"
  },
  "instructions": [
    {
      "name": "initializeLimitTransfer",
      "discriminator": [
        231,
        140,
        57,
        76,
        17,
        243,
        161,
        149
      ],
      "accounts": [
        {
          "name": "vault"
        },
        {
          "name": "policyAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "vault"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "min",
          "type": "u64"
        },
        {
          "name": "max",
          "type": "u64"
        }
      ]
    },
    {
      "name": "validate",
      "discriminator": [
        60,
        252,
        90,
        66,
        246,
        253,
        232,
        139
      ],
      "accounts": [
        {
          "name": "vault"
        }
      ],
      "args": [
        {
          "name": "operation",
          "type": {
            "defined": {
              "name": "validateOperation"
            }
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "limitTransfer",
      "discriminator": [
        247,
        207,
        59,
        55,
        224,
        191,
        85,
        213
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidData",
      "msg": "Invalid data."
    },
    {
      "code": 6001,
      "name": "amountTooHigh",
      "msg": "Amount too high."
    },
    {
      "code": 6002,
      "name": "amountTooLow",
      "msg": "Amount too low."
    },
    {
      "code": 6003,
      "name": "invalidSeed",
      "msg": "Invalid seed. Non ASCII"
    },
    {
      "code": 6004,
      "name": "invalidPolicyPda",
      "msg": "Invalid policy PDA."
    }
  ],
  "types": [
    {
      "name": "limitTransfer",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "max",
            "type": "u64"
          },
          {
            "name": "min",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "validateOperation",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "creation"
          },
          {
            "name": "execution"
          }
        ]
      }
    }
  ]
};
