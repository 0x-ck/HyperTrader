/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/policy_multisig.json`.
 */
export type PolicyMultisig = {
  "address": "DP8vZFZ1PtxAU9SSp46eGtggxBHa6N6hj5pQaGAW9gKx",
  "metadata": {
    "name": "policyMultisig",
    "version": "0.1.0",
    "spec": "0.1.0"
  },
  "instructions": [
    {
      "name": "approve",
      "discriminator": [
        69,
        74,
        217,
        36,
        115,
        117,
        97,
        76
      ],
      "accounts": [
        {
          "name": "policyAccount",
          "writable": true
        },
        {
          "name": "owner",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "initializeMultisig",
      "discriminator": [
        220,
        130,
        117,
        21,
        27,
        227,
        78,
        213
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
          "name": "owners",
          "type": {
            "vec": "pubkey"
          }
        },
        {
          "name": "threshold",
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
      "name": "multiSig",
      "discriminator": [
        185,
        236,
        37,
        72,
        176,
        174,
        250,
        169
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidThreshold",
      "msg": "Invalid threshold."
    },
    {
      "code": 6001,
      "name": "invalidOwnersLen",
      "msg": "Owners length must be non zero."
    },
    {
      "code": 6002,
      "name": "invalidOwner",
      "msg": "Invalid owner."
    },
    {
      "code": 6003,
      "name": "notEnoughSigners",
      "msg": "Not enough owners signed this transaction."
    },
    {
      "code": 6004,
      "name": "uniqueOwners",
      "msg": "Owners must be unique"
    },
    {
      "code": 6005,
      "name": "alreadyExecuted",
      "msg": "The given transaction has already been executed."
    },
    {
      "code": 6006,
      "name": "transactionAlreadyPending",
      "msg": "A transaction is already pending approval."
    },
    {
      "code": 6007,
      "name": "noPendingTransaction",
      "msg": "No pending transaction to approve."
    },
    {
      "code": 6008,
      "name": "invalidPendingTransaction",
      "msg": "The given transaction is not pending approval."
    },
    {
      "code": 6009,
      "name": "invalidPolicyPda",
      "msg": "Invalid policy PDA."
    }
  ],
  "types": [
    {
      "name": "multiSig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owners",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "threshold",
            "type": "u64"
          },
          {
            "name": "pendingTransaction",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "pendingSignatures",
            "type": {
              "vec": "bool"
            }
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
