const axios = require("axios");

async function createNotionPage({ title, content }) {

  const token = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!token || !databaseId) {
    throw new Error("Notion config missing");
  }

  const res = await axios.post(
    "https://api.notion.com/v1/pages",
    {
      parent: { database_id: databaseId },
      properties: {
        title: {
          title: [
            {
              text: { content: title }
            }
          ]
        }
      },
      children: [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                type: "text",
                text: { content }
              }
            ]
          }
        }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": "2022-06-28"
      }
    }
  );

  return res.data.id;

}

module.exports = {
  createNotionPage
};