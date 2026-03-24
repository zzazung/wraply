module.exports = async ({ context }) => {

  const content = context.lastResult?.output || context.lastResult || "";

  return {

    output: `🚀 광고 문구:\n${content}\n지금 바로 구매하세요!`

  };

};