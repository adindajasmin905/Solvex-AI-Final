module.exports = function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({
      error: "Method tidak didukung."
    });
  }

  return response.status(200).json({
    model: process.env.OPENROUTER_MODEL || "openrouter/free"
  });
};
