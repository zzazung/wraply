module.exports = async ({ context }) => {

  const product = context.product || "상품";

  return {

    output: `🔥 ${product}의 매력적인 상품 설명입니다`

  };

};