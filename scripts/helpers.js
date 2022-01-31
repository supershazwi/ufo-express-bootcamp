import moment from "moment";
import { edit } from "./jsonFileStorage.js";

let dateTracker = null;

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

export const checkDay = () => {
  console.log("inside checkDay");

  if (dateTracker === null) {
    dateTracker = moment().format("DD");
  }

  setInterval(() => {
    console.log("in interval");
    if (moment().format("DD") !== dateTracker) {
      console.log("refresh!");
      // new day
      dateTracker = moment().format("DD");
      edit(
        "data.json",
        (err, jsonContentObj) => {
          // If no error, edit the content
          if (!err) {
            jsonContentObj["uniqueVisitorCounter"] = 0;
          }
        },
        (err, jsonContentStr) => {
          if (!err) {
            return;
          }
        }
      );
    }
  }, 1000);
};
