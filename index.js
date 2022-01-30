import express from "express";
import methodOverride from "method-override";
import slugify from "slugify";
import { add, read, edit } from "./scripts/jsonFileStorage.js";

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride("_method"));

// CRUD SHAPES

app.get("/shapes/:shapeSlug", (request, response) => {
  read("data.json", (readErr, data) => {
    if (!readErr) {
      data["sightings"] = data["sightings"].filter((sighting) => {
        return sighting.shapeSlug === request.params.shapeSlug;
      });

      data.shape = data["sightings"][0].shape;

      response.render("sightingsByShape", data);
    }
  });
});

app.get("/shapes", (request, response) => {
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

      response.render("shapes", result);
    }
  });
});

// CRUD SIGHTINGS

app.delete("/sighting/:index/delete", (request, response) => {
  edit(
    "data.json",
    (err, jsonContentObj) => {
      // If no error, edit the content
      if (!err) {
        jsonContentObj["sightings"].splice(request.params.index, 1);
      }
    },
    (err, jsonContentStr) => {
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
  read("data.json", (readErr, data) => {
    if (!readErr) {
      let sighting = data["sightings"][request.params.index];
      if (sighting === null || sighting === undefined) {
        response.status(404).send("Sorry, we cannot find that!");
      } else {
        sighting.index = request.params.index;
        response.render("editSighting", sighting);
      }
    }
  });
});

app.get("/sighting/:index", (request, response) => {
  read("data.json", (readErr, data) => {
    if (!readErr) {
      let sighting = data["sightings"][request.params.index];
      if (sighting === null || sighting === undefined) {
        response.status(404).send("Sorry, we cannot find that!");
      } else {
        sighting.index = request.params.index;
        response.render("viewSighting", sighting);
      }
    }
  });
});

app.get("/sighting", (request, response) => {
  response.render("addSighting");
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
  read("data.json", (readErr, data) => {
    if (!readErr) {
      response.render("sightings", data);
    }
  });
});

app.listen(3004);
