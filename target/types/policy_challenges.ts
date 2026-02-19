/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/policy_challenges.json`.
 */
export type PolicyChallenges = {
  "address": "BhX2Cw1nh8WqBDH8QNFoNmqTKf6Df4W4aDkQCH4mtVno",
  "metadata": {
    "name": "policyChallenges",
    "version": "0.1.0",
    "spec": "0.1.0"
  },
  "instructions": [
    {
      "name": "claimPayout",
      "discriminator": [
        127,
        240,
        132,
        62,
        227,
        198,
        146,
        133
      ],
      "accounts": [
        {
          "name": "challengeAccount",
          "writable": true
        },
        {
          "name": "participant",
          "writable": true,
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "createChallengeTemplate",
      "discriminator": [
        143,
        77,
        148,
        223,
        18,
        207,
        212,
        41
      ],
      "accounts": [
        {
          "name": "challengeTemplateAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "arg",
                "path": "stageId"
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
          "name": "stageId",
          "type": "u64"
        },
        {
          "name": "dto",
          "type": {
            "defined": {
              "name": "challengeTemplateUpdateInsertDto"
            }
          }
        }
      ]
    },
    {
      "name": "joinChallenge",
      "discriminator": [
        41,
        104,
        214,
        73,
        32,
        168,
        76,
        79
      ],
      "accounts": [
        {
          "name": "challengeTemplateAccount",
          "writable": true
        },
        {
          "name": "challengeAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "participant"
              },
              {
                "kind": "arg",
                "path": "challengeId"
              }
            ]
          }
        },
        {
          "name": "participant",
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
          "name": "challengeId",
          "type": "string"
        },
        {
          "name": "dto",
          "type": {
            "defined": {
              "name": "challengeInsertDto"
            }
          }
        }
      ]
    },
    {
      "name": "updateChallenge",
      "discriminator": [
        189,
        212,
        76,
        181,
        2,
        202,
        238,
        16
      ],
      "accounts": [
        {
          "name": "challengeTemplateAccount"
        },
        {
          "name": "challengeAccount",
          "writable": true
        },
        {
          "name": "sender",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "dto",
          "type": {
            "defined": {
              "name": "challengeUpdateDto"
            }
          }
        }
      ]
    },
    {
      "name": "updateChallengeTemplate",
      "discriminator": [
        114,
        162,
        103,
        83,
        47,
        148,
        138,
        174
      ],
      "accounts": [
        {
          "name": "challengeTemplateAccount",
          "writable": true
        },
        {
          "name": "signer",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "dto",
          "type": {
            "defined": {
              "name": "challengeTemplateUpdateInsertDto"
            }
          }
        }
      ]
    },
    {
      "name": "updateChallengeTemplateAdmin",
      "discriminator": [
        81,
        198,
        17,
        48,
        33,
        251,
        104,
        80
      ],
      "accounts": [
        {
          "name": "challengeTemplateAccount",
          "writable": true
        },
        {
          "name": "signer",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "newAdmin",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "updateChallengeTemplateDailyDrawdown",
      "discriminator": [
        100,
        174,
        225,
        136,
        76,
        206,
        146,
        63
      ],
      "accounts": [
        {
          "name": "challengeTemplateAccount",
          "writable": true
        },
        {
          "name": "signer",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "dailyDrawdown",
          "type": {
            "defined": {
              "name": "percent"
            }
          }
        }
      ]
    },
    {
      "name": "updateChallengeTemplateEntranceCost",
      "discriminator": [
        7,
        181,
        39,
        15,
        22,
        133,
        159,
        130
      ],
      "accounts": [
        {
          "name": "challengeTemplateAccount",
          "writable": true
        },
        {
          "name": "signer",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "entranceCost",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateChallengeTemplateEntranceTokenMint",
      "discriminator": [
        94,
        23,
        238,
        69,
        73,
        130,
        153,
        89
      ],
      "accounts": [
        {
          "name": "challengeTemplateAccount",
          "writable": true
        },
        {
          "name": "signer",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "entranceTokenMint",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "updateChallengeTemplateIsActive",
      "discriminator": [
        57,
        176,
        93,
        106,
        136,
        216,
        189,
        142
      ],
      "accounts": [
        {
          "name": "challengeTemplateAccount",
          "writable": true
        },
        {
          "name": "signer",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "isActive",
          "type": "bool"
        }
      ]
    },
    {
      "name": "updateChallengeTemplateMaxParticipants",
      "discriminator": [
        86,
        71,
        53,
        242,
        216,
        57,
        184,
        109
      ],
      "accounts": [
        {
          "name": "challengeTemplateAccount",
          "writable": true
        },
        {
          "name": "signer",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "maxParticipants",
          "type": {
            "defined": {
              "name": "smallScalar"
            }
          }
        }
      ]
    },
    {
      "name": "updateChallengeTemplateMaximumLoss",
      "discriminator": [
        111,
        239,
        61,
        167,
        113,
        215,
        92,
        38
      ],
      "accounts": [
        {
          "name": "challengeTemplateAccount",
          "writable": true
        },
        {
          "name": "signer",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "maximumLoss",
          "type": {
            "defined": {
              "name": "percent"
            }
          }
        }
      ]
    },
    {
      "name": "updateChallengeTemplateMinimumTradingDays",
      "discriminator": [
        67,
        107,
        22,
        76,
        9,
        91,
        83,
        8
      ],
      "accounts": [
        {
          "name": "challengeTemplateAccount",
          "writable": true
        },
        {
          "name": "signer",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "minimumTradingDays",
          "type": {
            "defined": {
              "name": "smallScalar"
            }
          }
        }
      ]
    },
    {
      "name": "updateChallengeTemplateProfitTarget",
      "discriminator": [
        64,
        12,
        173,
        109,
        35,
        183,
        191,
        114
      ],
      "accounts": [
        {
          "name": "challengeTemplateAccount",
          "writable": true
        },
        {
          "name": "signer",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "profitTarget",
          "type": {
            "defined": {
              "name": "percent"
            }
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
        },
        {
          "name": "transaction"
        },
        {
          "name": "policyAccount"
        },
        {
          "name": "sender"
        },
        {
          "name": "signer"
        }
      ],
      "args": []
    },
    {
      "name": "validateCreation",
      "discriminator": [
        112,
        63,
        138,
        178,
        246,
        43,
        119,
        49
      ],
      "accounts": [
        {
          "name": "vault"
        },
        {
          "name": "transaction"
        },
        {
          "name": "policyAccount"
        },
        {
          "name": "sender"
        },
        {
          "name": "signer"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "challenge",
      "discriminator": [
        119,
        250,
        161,
        121,
        119,
        81,
        22,
        208
      ]
    },
    {
      "name": "challengeTemplate",
      "discriminator": [
        83,
        2,
        108,
        68,
        110,
        219,
        175,
        21
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
      "name": "unauthorizedAdmin",
      "msg": "Unauthorized admin."
    },
    {
      "code": 6002,
      "name": "challengeNotActive",
      "msg": "Challenge is not active."
    },
    {
      "code": 6003,
      "name": "challengeFull",
      "msg": "Challenge is full."
    },
    {
      "code": 6004,
      "name": "alreadyParticipating",
      "msg": "Already participating in challenge."
    },
    {
      "code": 6005,
      "name": "invalidTimeRange",
      "msg": "Invalid time range."
    },
    {
      "code": 6006,
      "name": "invalidMaxParticipants",
      "msg": "Invalid max participants."
    },
    {
      "code": 6007,
      "name": "invalidEntranceCost",
      "msg": "Invalid entrance cost."
    },
    {
      "code": 6008,
      "name": "invalidMinimumTradingDays",
      "msg": "Invalid minimum trading days."
    },
    {
      "code": 6009,
      "name": "invalidDailyDrawdown",
      "msg": "Invalid daily drawdown."
    },
    {
      "code": 6010,
      "name": "invalidMaximumLoss",
      "msg": "Invalid maximum loss."
    },
    {
      "code": 6011,
      "name": "invalidProfitTarget",
      "msg": "Invalid profit target."
    },
    {
      "code": 6012,
      "name": "invalidParticipantIndex",
      "msg": "Invalid participant index."
    },
    {
      "code": 6013,
      "name": "invalidChallengeId",
      "msg": "Invalid challenge ID."
    }
  ],
  "types": [
    {
      "name": "amount",
      "type": {
        "kind": "struct",
        "fields": [
          "i64"
        ]
      }
    },
    {
      "name": "challenge",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "challengeId",
            "type": "string"
          },
          {
            "name": "stageId",
            "type": "u16"
          },
          {
            "name": "stageSequence",
            "type": "u8"
          },
          {
            "name": "stageType",
            "type": {
              "defined": {
                "name": "stageType"
              }
            }
          },
          {
            "name": "effectiveFrom",
            "type": "u64"
          },
          {
            "name": "startingBalance",
            "type": "u64"
          },
          {
            "name": "latestBalance",
            "type": "u64"
          },
          {
            "name": "profitTarget",
            "type": {
              "defined": {
                "name": "profitTarget"
              }
            }
          },
          {
            "name": "tradingDays",
            "type": {
              "defined": {
                "name": "tradingDays"
              }
            }
          },
          {
            "name": "maximumLoss",
            "type": {
              "defined": {
                "name": "maximumLoss"
              }
            }
          },
          {
            "name": "dailyDrawdown",
            "type": {
              "defined": {
                "name": "dailyDrawdown"
              }
            }
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "challengeStatus"
              }
            }
          },
          {
            "name": "payout",
            "type": "u64"
          },
          {
            "name": "createdAt",
            "type": "u64"
          },
          {
            "name": "updatedAt",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "challengeInsertDto",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "stageId",
            "type": "u16"
          },
          {
            "name": "stageSequence",
            "type": "u8"
          },
          {
            "name": "profitTarget",
            "type": {
              "defined": {
                "name": "profitTarget"
              }
            }
          },
          {
            "name": "tradingDays",
            "type": {
              "defined": {
                "name": "tradingDays"
              }
            }
          },
          {
            "name": "maximumLoss",
            "type": {
              "defined": {
                "name": "maximumLoss"
              }
            }
          },
          {
            "name": "dailyDrawdown",
            "type": {
              "defined": {
                "name": "dailyDrawdown"
              }
            }
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "challengeStatus"
              }
            }
          },
          {
            "name": "payout",
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
      "name": "challengeStatus",
      "repr": {
        "kind": "rust"
      },
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "pending"
          },
          {
            "name": "active"
          },
          {
            "name": "halted"
          },
          {
            "name": "expired"
          },
          {
            "name": "failed"
          },
          {
            "name": "passed"
          }
        ]
      }
    },
    {
      "name": "challengeTemplate",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "stageId",
            "type": "u16"
          },
          {
            "name": "stageSequence",
            "type": "u8"
          },
          {
            "name": "stageType",
            "type": {
              "defined": {
                "name": "stageType"
              }
            }
          },
          {
            "name": "startingDeposit",
            "type": "u64"
          },
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "entranceCost",
            "type": "u64"
          },
          {
            "name": "entranceTokenMint",
            "type": "pubkey"
          },
          {
            "name": "minimumTradingDays",
            "type": {
              "defined": {
                "name": "smallScalar"
              }
            }
          },
          {
            "name": "dailyDrawdown",
            "type": {
              "defined": {
                "name": "percent"
              }
            }
          },
          {
            "name": "maximumLoss",
            "type": {
              "defined": {
                "name": "percent"
              }
            }
          },
          {
            "name": "profitTarget",
            "type": {
              "defined": {
                "name": "percent"
              }
            }
          },
          {
            "name": "maxParticipants",
            "type": {
              "defined": {
                "name": "smallScalar"
              }
            }
          },
          {
            "name": "participants",
            "type": {
              "defined": {
                "name": "smallScalar"
              }
            }
          },
          {
            "name": "totalPool",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "challengeTemplateUpdateInsertDto",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "stageSequence",
            "type": "u8"
          },
          {
            "name": "stageType",
            "type": {
              "defined": {
                "name": "stageType"
              }
            }
          },
          {
            "name": "startingDeposit",
            "type": "u64"
          },
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "entranceCost",
            "type": "u64"
          },
          {
            "name": "entranceTokenMint",
            "type": "pubkey"
          },
          {
            "name": "minimumTradingDays",
            "type": {
              "defined": {
                "name": "smallScalar"
              }
            }
          },
          {
            "name": "dailyDrawdown",
            "type": {
              "defined": {
                "name": "percent"
              }
            }
          },
          {
            "name": "maximumLoss",
            "type": {
              "defined": {
                "name": "percent"
              }
            }
          },
          {
            "name": "profitTarget",
            "type": {
              "defined": {
                "name": "percent"
              }
            }
          },
          {
            "name": "maxParticipants",
            "type": {
              "defined": {
                "name": "smallScalar"
              }
            }
          },
          {
            "name": "isActive",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "challengeUpdateDto",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "challengeId",
            "type": "string"
          },
          {
            "name": "latestBalance",
            "type": "u64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "challengeStatus"
              }
            }
          },
          {
            "name": "profitTarget",
            "type": {
              "defined": {
                "name": "profitTarget"
              }
            }
          },
          {
            "name": "tradingDays",
            "type": {
              "defined": {
                "name": "tradingDays"
              }
            }
          },
          {
            "name": "maximumLoss",
            "type": {
              "defined": {
                "name": "maximumLoss"
              }
            }
          },
          {
            "name": "dailyDrawdown",
            "type": {
              "defined": {
                "name": "dailyDrawdown"
              }
            }
          },
          {
            "name": "payout",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "dailyDrawdown",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "drawdownType",
            "type": {
              "defined": {
                "name": "drawdownType"
              }
            }
          },
          {
            "name": "limitPercentage",
            "type": {
              "defined": {
                "name": "percent"
              }
            }
          },
          {
            "name": "limitAmount",
            "type": {
              "defined": {
                "name": "amount"
              }
            }
          },
          {
            "name": "maxEquity",
            "type": {
              "defined": {
                "name": "amount"
              }
            }
          },
          {
            "name": "currentDrawdownPercentage",
            "type": {
              "defined": {
                "name": "percent"
              }
            }
          },
          {
            "name": "currentDrawdownAmount",
            "type": {
              "defined": {
                "name": "amount"
              }
            }
          },
          {
            "name": "violationTriggered",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "drawdownType",
      "repr": {
        "kind": "rust"
      },
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "static"
          },
          {
            "name": "dynamic"
          }
        ]
      }
    },
    {
      "name": "maximumLoss",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "maximumLossPercentage",
            "type": {
              "defined": {
                "name": "percent"
              }
            }
          },
          {
            "name": "maximumLossAmount",
            "type": {
              "defined": {
                "name": "amount"
              }
            }
          },
          {
            "name": "currentLossAchieved",
            "type": {
              "defined": {
                "name": "percent"
              }
            }
          },
          {
            "name": "currentLossAchievedAmount",
            "type": {
              "defined": {
                "name": "amount"
              }
            }
          }
        ]
      }
    },
    {
      "name": "percent",
      "type": {
        "kind": "struct",
        "fields": [
          "i16"
        ]
      }
    },
    {
      "name": "profitTarget",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "target",
            "type": {
              "defined": {
                "name": "percent"
              }
            }
          },
          {
            "name": "targetAmount",
            "type": {
              "defined": {
                "name": "amount"
              }
            }
          },
          {
            "name": "achieved",
            "type": {
              "defined": {
                "name": "percent"
              }
            }
          },
          {
            "name": "achievedAmount",
            "type": {
              "defined": {
                "name": "amount"
              }
            }
          }
        ]
      }
    },
    {
      "name": "smallScalar",
      "type": {
        "kind": "struct",
        "fields": [
          "i16"
        ]
      }
    },
    {
      "name": "stageType",
      "repr": {
        "kind": "rust"
      },
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "evaluation"
          },
          {
            "name": "funded"
          }
        ]
      }
    },
    {
      "name": "tradingDays",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "required",
            "type": {
              "defined": {
                "name": "smallScalar"
              }
            }
          },
          {
            "name": "completed",
            "type": {
              "defined": {
                "name": "smallScalar"
              }
            }
          },
          {
            "name": "requirementsMet",
            "type": "bool"
          },
          {
            "name": "remainingDays",
            "type": {
              "defined": {
                "name": "smallScalar"
              }
            }
          }
        ]
      }
    }
  ]
};
