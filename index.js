import express from "express";
import methodOverride from "method-override";
import slugify from "slugify";
import moment from "moment";
import cookieParser from "cookie-parser";
import { add, read, edit, remove } from "./scripts/jsonFileStorage.js";
import {
  incrementVisitCounter,
  checkWhetherUniqueVisitor,
} from "./scripts/helpers.js";

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride("_method"));
app.use(cookieParser());

// CRUD SHAPES

app.get("/shapes/:shapeSlug", (request, response) => {
  const visits = incrementVisitCounter(request, response);
  const uniqueVisitorCounter = checkWhetherUniqueVisitor(request, response);

  read("data.json", (readErr, data) => {
    if (!readErr) {
      data["sightings"] = data["sightings"].filter((sighting) => {
        return sighting.shapeSlug === request.params.shapeSlug;
      });

      data.shape = data["sightings"][0].shape;
      data.visits = visits;
      data.uniqueVisitorCounter += uniqueVisitorCounter;

      edit(
        "data.json",
        (err, jsonContentObj) => {
          // If no error, edit the content
          if (!err) {
            jsonContentObj["uniqueVisitorCounter"] = data.uniqueVisitorCounter;
            jsonContentObj["totalVisits"] = visits;
          }
        },
        (err, jsonContentStr) => {
          if (!err) {
            response.render("sightingsByShape", data);
          }
        }
      );
    }
  });
});

app.get("/shapes", (request, response) => {
  const visits = incrementVisitCounter(request, response);
  const uniqueVisitorCounter = checkWhetherUniqueVisitor(request, response);

  read("data.json", (readErr, data) => {
    if (!readErr) {
      const sightings = data["sightings"];
      const result = { shapes: [] };

      sightings.forEach((sighting) => {
        if (result.shapes.indexOf(sighting.shape) === -1) {
          const obj = {
            shape: sighting.shape,
            shapeSlug: sighting.shapeSlug,
          };

          result.shapes.push(obj);
        }
      });

      result.visits = visits;
      data.uniqueVisitorCounter += uniqueVisitorCounter;
      result.uniqueVisitorCounter = data.uniqueVisitorCounter;

      edit(
        "data.json",
        (err, jsonContentObj) => {
          // If no error, edit the content
          if (!err) {
            jsonContentObj["uniqueVisitorCounter"] = data.uniqueVisitorCounter;
            jsonContentObj["totalVisits"] = visits;
          }
        },
        (err, jsonContentStr) => {
          if (!err) {
            response.render("shapes", result);
          }
        }
      );
    }
  });
});

// CRUD SIGHTINGS

app.delete("/sighting/:index/delete", (request, response) => {
  remove(
    "data.json",
    "sightings",
    request.params.index,
    (err, jsonContentObj) => {
      if (!err) {
        response.redirect(`/`);
      }
    }
  );
});

app.put("/sighting/:index/edit", (request, response) => {
  request.body.shapeSlug = slugify(request.body.shape);
  edit(
    "data.json",
    (err, jsonContentObj) => {
      // If no error, edit the content
      if (!err) {
        jsonContentObj["sightings"][request.params.index] = request.body;
      }
    },
    (err, jsonContentStr) => {
      if (!err) {
        response.redirect(`/sighting/${request.params.index}`);
      }
    }
  );
});

app.get("/sighting/:index/edit", (request, response) => {
  const visits = incrementVisitCounter(request, response);
  const uniqueVisitorCounter = checkWhetherUniqueVisitor(request, response);

  read("data.json", (readErr, data) => {
    if (!readErr) {
      let sighting = data["sightings"][request.params.index];
      if (sighting === null || sighting === undefined) {
        response.status(404).send("Sorry, we cannot find that!");
      } else {
        sighting.index = request.params.index;
        sighting.visits = visits;

        edit(
          "data.json",
          (err, jsonContentObj) => {
            // If no error, edit the content
            if (!err) {
              jsonContentObj["uniqueVisitorCounter"] += uniqueVisitorCounter;
              jsonContentObj["totalVisits"] = visits;
              sighting.uniqueVisitorCounter =
                jsonContentObj["uniqueVisitorCounter"];
            }
          },
          (err, jsonContentStr) => {
            if (!err) {
              response.render("editSighting", sighting);
            }
          }
        );
      }
    }
  });
});

app.get("/sighting/:index", (request, response) => {
  const visits = incrementVisitCounter(request, response);
  const uniqueVisitorCounter = checkWhetherUniqueVisitor(request, response);

  read("data.json", (readErr, data) => {
    if (!readErr) {
      let sighting = data["sightings"][request.params.index];
      if (sighting === null || sighting === undefined) {
        response.status(404).send("Sorry, we cannot find that!");
      } else {
        sighting.index = request.params.index;
        sighting.created_at = moment(sighting.created_at).fromNow();
        sighting.date_time = moment(sighting.date_time).format(
          "dddd, MMMM Do YYYY"
        );
        sighting.visits = visits;
        data.uniqueVisitorCounter += uniqueVisitorCounter;
        sighting.uniqueVisitorCounter = data.uniqueVisitorCounter;

        edit(
          "data.json",
          (err, jsonContentObj) => {
            // If no error, edit the content
            if (!err) {
              jsonContentObj["uniqueVisitorCounter"] =
                data.uniqueVisitorCounter;
              jsonContentObj["totalVisits"] = visits;
            }
          },
          (err, jsonContentStr) => {
            if (!err) {
              response.render("viewSighting", sighting);
            }
          }
        );
      }
    }
  });
});

app.get("/sighting", (request, response) => {
  const visits = incrementVisitCounter(request, response);
  const uniqueVisitorCounter = checkWhetherUniqueVisitor(request, response);

  const data = {
    visits,
  };

  edit(
    "data.json",
    (err, jsonContentObj) => {
      // If no error, edit the content
      if (!err) {
        jsonContentObj["uniqueVisitorCounter"] += uniqueVisitorCounter;
        data.uniqueVisitorCounter = jsonContentObj["uniqueVisitorCounter"];
        jsonContentObj["totalVisits"] = visits;
      }
    },
    (err, jsonContentStr) => {
      if (!err) {
        response.render("addSighting", data);
      }
    }
  );
});

app.post("/sighting", (request, response) => {
  request.body.shapeSlug = slugify(request.body.shape);

  add("data.json", "sightings", request.body, (err, data) => {
    if (err) {
      response.status(500).send("DB write error.");
      return;
    }
    const dataObject = JSON.parse(data);

    response.redirect(
      `/sighting/${Object.keys(dataObject["sightings"]).length - 1}`
    );
  });
});

app.get("/", (request, response) => {
  const visits = incrementVisitCounter(request, response);
  const uniqueVisitorCounter = checkWhetherUniqueVisitor(request, response);

  read("data.json", (readErr, data) => {
    if (!readErr) {
      data.visits = visits;

      edit(
        "data.json",
        (err, jsonContentObj) => {
          // If no error, edit the content
          if (!err) {
            jsonContentObj["uniqueVisitorCounter"] += uniqueVisitorCounter;
            data.uniqueVisitorCounter = jsonContentObj["uniqueVisitorCounter"];
            jsonContentObj["totalVisits"] = visits;
          }
        },
        (err, jsonContentStr) => {
          if (!err) {
            response.render("sightings", data);
          }
        }
      );
    }
  });
});

app.listen(3004);
