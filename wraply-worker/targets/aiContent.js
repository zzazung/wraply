module.exports = async function aiContent(ctx) {

  const { payload, config } = ctx;

  console.log("[ai_content]", {
    config
  });

  return {
    text: `Generated content for ${payload?.product || "item"}`
  };

};