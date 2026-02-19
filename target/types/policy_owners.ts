/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/policy_owners.json`.
 */
export type PolicyOwners = {
  "address": "G2pCRumKN4itQdQUbwqy2r6wUNhjokHdQ1Yx6BbCKtRT",
  "metadata": {
    "name": "policyOwners",
    "version": "0.1.0",
    "spec": "0.1.0"
  },
  "instructions": [
    {
      "name": "initializeOwners",
      "discriminator": [
        145,
        41,
        103,
        101,
        229,
        205,
        135,
        157
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
      "name": "owners",
      "discriminator": [
        96,
        145,
        150,
        191,
        50,
        61,
        92,
        51
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorizedSender",
      "msg": "Unauthorized sender."
    },
    {
      "code": 6001,
      "name": "invalidPolicyPda",
      "msg": "Invalid policy PDA."
    }
  ],
  "types": [
    {
      "name": "owners",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owners",
            "type": {
              "vec": "pubkey"
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
