export const PLANS = {
    FREE: {
      name: "FREE",
      monthlyRequestLimit: 1000,
      rateLimitPerMinute: 60
    },
    PRO: {
      name: "PRO",
      monthlyRequestLimit: 100000,
      rateLimitPerMinute: 1000
    },
    ENTERPRISE: {
        name:"ENTERPRISE",
        monthlyRequestLimit: 10000000,
        rateLimitPerMinute: 10000
    }
  };