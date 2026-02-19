/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/policy_deny_all.json`.
 */
export type PolicyDenyAll = {
  "address": "4xsSjQ4drV5jhYYgeCZMHX9tM3k6vMRvbdpySwmi5cvw",
  "metadata": {
    "name": "policyDenyAll",
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
  "errors": [
    {
      "code": 6000,
      "name": "denied",
      "msg": "Action denied by policy."
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
