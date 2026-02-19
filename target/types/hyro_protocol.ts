/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/hyro_protocol.json`.
 */
export type HyroProtocol = {
  "address": "2fYZAvtCCuRBYQ229q2WHrvwWtiSwwa5Qbipo3ceC3N9",
  "metadata": {
    "name": "hyroProtocol",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "createTx",
      "discriminator": [
        97,
        223,
        80,
        153,
        55,
        13,
        155,
        12
      ],
      "accounts": [
        {
          "name": "vault"
        },
        {
          "name": "transaction",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "arg",
                "path": "nonce"
              }
            ]
          }
        },
        {
          "name": "policyAccount",
          "writable": true
        },
        {
          "name": "policyProgram"
        },
        {
          "name": "vaultSigner",
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
          "name": "nonce",
          "type": "u64"
        },
        {
          "name": "pid",
          "type": "pubkey"
        },
        {
          "name": "accs",
          "type": {
            "vec": {
              "defined": {
                "name": "transactionAccount"
              }
            }
          }
        },
        {
          "name": "data",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "executeTx",
      "discriminator": [
        249,
        17,
        145,
        23,
        12,
        252,
        17,
        41
      ],
      "accounts": [
        {
          "name": "vault"
        },
        {
          "name": "transaction"
        },
        {
          "name": "vaultSigner",
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
          "name": "policyAccount",
          "writable": true
        },
        {
          "name": "policyProgram"
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "initializeManagerRegistry",
      "discriminator": [
        45,
        38,
        8,
        215,
        181,
        198,
        110,
        202
      ],
      "accounts": [
        {
          "name": "registry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  110,
                  97,
                  103,
                  101,
                  114,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeVault",
      "discriminator": [
        48,
        191,
        163,
        44,
        71,
        129,
        63,
        164
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "arg",
                "path": "seed"
              }
            ]
          }
        },
        {
          "name": "authority",
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
          "name": "seed",
          "type": "string"
        },
        {
          "name": "policyProgram",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "issueChildVault",
      "discriminator": [
        77,
        93,
        95,
        1,
        227,
        206,
        201,
        173
      ],
      "accounts": [
        {
          "name": "parentVault",
          "writable": true
        },
        {
          "name": "childVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "parentVault"
              },
              {
                "kind": "arg",
                "path": "seed"
              },
              {
                "kind": "arg",
                "path": "allocation"
              },
              {
                "kind": "account",
                "path": "manager"
              }
            ]
          }
        },
        {
          "name": "childAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "childVault"
              }
            ]
          }
        },
        {
          "name": "managerRegistry",
          "writable": true
        },
        {
          "name": "managerProfile",
          "writable": true
        },
        {
          "name": "childPolicy"
        },
        {
          "name": "manager"
        },
        {
          "name": "admin",
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
          "name": "seed",
          "type": "string"
        },
        {
          "name": "allocation",
          "type": "u64"
        },
        {
          "name": "managerFees",
          "type": {
            "defined": {
              "name": "managerFeeStructure"
            }
          }
        }
      ]
    },
    {
      "name": "ping",
      "discriminator": [
        173,
        0,
        94,
        236,
        73,
        133,
        225,
        153
      ],
      "accounts": [
        {
          "name": "signer",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "registerManager",
      "discriminator": [
        104,
        14,
        206,
        198,
        57,
        194,
        90,
        109
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "manager"
        },
        {
          "name": "managerProfile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  110,
                  97,
                  103,
                  101,
                  114,
                  95,
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "manager"
              }
            ]
          }
        },
        {
          "name": "registry",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "riskRating",
          "type": {
            "defined": {
              "name": "riskRating"
            }
          }
        }
      ]
    },
    {
      "name": "returnFunds",
      "discriminator": [
        220,
        104,
        119,
        202,
        186,
        1,
        45,
        90
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "managerTokenAccount",
          "writable": true
        },
        {
          "name": "vaultTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "managerProfile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  110,
                  97,
                  103,
                  101,
                  114,
                  95,
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "manager"
              }
            ]
          }
        },
        {
          "name": "manager",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "useFunds",
      "discriminator": [
        225,
        89,
        79,
        83,
        153,
        141,
        236,
        230
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "vaultAuthority",
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
          "name": "managerTokenAccount",
          "writable": true
        },
        {
          "name": "vaultTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "managerProfile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  110,
                  97,
                  103,
                  101,
                  114,
                  95,
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "manager"
              }
            ]
          }
        },
        {
          "name": "manager",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "verifyManager",
      "discriminator": [
        61,
        121,
        49,
        235,
        68,
        94,
        106,
        30
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "managerProfile",
          "writable": true
        },
        {
          "name": "registry"
        }
      ],
      "args": [
        {
          "name": "verificationStatus",
          "type": {
            "defined": {
              "name": "verificationStatus"
            }
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "managerProfile",
      "discriminator": [
        135,
        12,
        238,
        243,
        236,
        32,
        123,
        52
      ]
    },
    {
      "name": "managerRegistry",
      "discriminator": [
        181,
        78,
        54,
        100,
        122,
        86,
        63,
        114
      ]
    },
    {
      "name": "transaction",
      "discriminator": [
        11,
        24,
        174,
        129,
        203,
        117,
        242,
        23
      ]
    },
    {
      "name": "vault",
      "discriminator": [
        211,
        8,
        232,
        43,
        2,
        152,
        117,
        119
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorizedAdmin",
      "msg": "Unauthorized admin access."
    },
    {
      "code": 6001,
      "name": "invalidManager",
      "msg": "Invalid manager profile."
    },
    {
      "code": 6002,
      "name": "unverifiedManager",
      "msg": "Manager is not verified."
    },
    {
      "code": 6003,
      "name": "insufficientFunds",
      "msg": "Insufficient funds for allocation."
    },
    {
      "code": 6004,
      "name": "invalidAllocation",
      "msg": "Invalid allocation amount."
    },
    {
      "code": 6005,
      "name": "invalidPolicyAccount",
      "msg": "Invalid policy account - PDA derivation failed."
    },
    {
      "code": 6006,
      "name": "invalidPolicyProgram",
      "msg": "Invalid policy program."
    },
    {
      "code": 6007,
      "name": "unauthorizedManager",
      "msg": "Unauthorized manager access."
    },
    {
      "code": 6008,
      "name": "insufficientOnchainBalance",
      "msg": "Insufficient onchain balance."
    },
    {
      "code": 6009,
      "name": "insufficientOffchainBalance",
      "msg": "Insufficient offchain balance."
    },
    {
      "code": 6010,
      "name": "invalidBalanceUpdate",
      "msg": "Invalid balance update."
    },
    {
      "code": 6011,
      "name": "transactionAlreadyExecuted",
      "msg": "Transaction already executed."
    }
  ],
  "types": [
    {
      "name": "feeCollectionFrequency",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "monthly"
          },
          {
            "name": "quarterly"
          },
          {
            "name": "annually"
          },
          {
            "name": "onWithdrawal"
          }
        ]
      }
    },
    {
      "name": "managerFeeStructure",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "performanceFeeRate",
            "type": "u16"
          },
          {
            "name": "managementFeeRate",
            "type": "u16"
          },
          {
            "name": "collectionFrequency",
            "type": {
              "defined": {
                "name": "feeCollectionFrequency"
              }
            }
          },
          {
            "name": "highWaterMark",
            "type": "u64"
          },
          {
            "name": "feeRecipient",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "managerProfile",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "managerPubkey",
            "type": "pubkey"
          },
          {
            "name": "verificationStatus",
            "type": {
              "defined": {
                "name": "verificationStatus"
              }
            }
          },
          {
            "name": "riskRating",
            "type": {
              "defined": {
                "name": "riskRating"
              }
            }
          },
          {
            "name": "totalAum",
            "type": "u64"
          },
          {
            "name": "activeVaults",
            "type": "u32"
          },
          {
            "name": "totalFeesEarned",
            "type": "u64"
          },
          {
            "name": "createdAt",
            "type": "u64"
          },
          {
            "name": "lastActivity",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "managerRegistry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "totalManagers",
            "type": "u32"
          },
          {
            "name": "totalAum",
            "type": "u64"
          },
          {
            "name": "createdAt",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "riskRating",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "conservative"
          },
          {
            "name": "moderate"
          },
          {
            "name": "aggressive"
          },
          {
            "name": "speculative"
          }
        ]
      }
    },
    {
      "name": "transaction",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "nonce",
            "type": "u64"
          },
          {
            "name": "didExecute",
            "type": "bool"
          },
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "programId",
            "type": "pubkey"
          },
          {
            "name": "data",
            "type": "bytes"
          },
          {
            "name": "accounts",
            "type": {
              "vec": {
                "defined": {
                  "name": "transactionAccount"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "transactionAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pubkey",
            "type": "pubkey"
          },
          {
            "name": "isSigner",
            "type": "bool"
          },
          {
            "name": "isWritable",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "vault",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "policyProgram",
            "type": "pubkey"
          },
          {
            "name": "seed",
            "type": "string"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "manager",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "parentVault",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "allocation",
            "type": "u64"
          },
          {
            "name": "onchainBalance",
            "type": "u64"
          },
          {
            "name": "offchainBalance",
            "type": "u64"
          },
          {
            "name": "totalBalance",
            "type": "u64"
          },
          {
            "name": "lastBalanceUpdate",
            "type": "u64"
          },
          {
            "name": "highWaterMark",
            "type": "u64"
          },
          {
            "name": "totalFeesPaid",
            "type": "u64"
          },
          {
            "name": "managerFees",
            "type": {
              "option": {
                "defined": {
                  "name": "managerFeeStructure"
                }
              }
            }
          },
          {
            "name": "createdAt",
            "type": "u64"
          },
          {
            "name": "lastFeeCollection",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "verificationStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "pending"
          },
          {
            "name": "verified"
          },
          {
            "name": "suspended"
          },
          {
            "name": "blacklisted"
          }
        ]
      }
    }
  ]
};
