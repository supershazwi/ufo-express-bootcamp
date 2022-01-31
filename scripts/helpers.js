export const incrementVisitCounter = (request, response) => {
  let visits = 0;
  if (request.cookies.visits) {
    visits = Number(request.cookies.visits);
  }

  visits += 1;

  response.cookie("visits", visits);

  return visits;
};

export const checkWhetherUniqueVisitor = (request, response) => {
  if (!request.cookies.uniqueVisitor) {
    response.cookie("uniqueVisitor", true);
    return 1;
  } else {
    return 0;
  }
};
