/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/policy_allow_any.json`.
 */
export type PolicyAllowAny = {
  "address": "Ag11DzSV7e6yrfCSKQx67gzEy6JbkEBFys8yreeRRc5N",
  "metadata": {
    "name": "policyAllowAny",
    "version": "0.1.0",
    "spec": "0.1.0"
  },
  "instructions": [
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
  "types": [
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
