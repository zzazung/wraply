const TASK_SCHEMA = {

  generate_content: {
    input: ["product"],
    output: "content"
  },

  generate_marketing: {
    input: ["lastResult"],
    output: "marketing"
  },

  customer_support: {
    input: ["history"],
    output: "response"
  },

  analyze_reviews: {
    input: ["reviews"],
    output: "analysis"
  },

  analyze_sales: {
    input: ["salesData"],
    output: "insight"
  },

  send_slack: {
    input: ["lastResult"],
    output: "slackResult"
  },

  create_notion_page: {
    input: ["lastResult"],
    output: "notionResult"
  },

  run_ads: {
    input: ["lastResult"],
    output: "adsResult"
  }

};

module.exports = {
  TASK_SCHEMA
};