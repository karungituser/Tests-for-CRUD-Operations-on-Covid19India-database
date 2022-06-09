const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "covid19India.db");
const app = express();
app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertDbStateObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};
const convertDbDistrictObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

// GET API1

app.get("/states/", async (request, response) => {
  const getStatesList = `SELECT * FROM state;`;
  const stateArray = await db.all(getStatesList);
  response.send(
    stateArray.map((eachSate) => convertDbStateObjectToResponseObject(eachSate))
  );
});

//GET API2

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateArray = `SELECT * FROM state WHERE state_id='${stateId}';`;
  const stateArray = await db.get(getStateArray);
  response.send(convertDbStateObjectToResponseObject(stateArray));
});

// POST API3

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDistrictList = `INSERT INTO district (district_name,state_id,cases,cured,active,deaths)
        VALUES ('${districtName}','${stateId}','${cases}','${cured}','${active}','${deaths}');`;
  const districtArray = await db.run(postDistrictList);
  response.send("District Successfully Added");
});

//GET API4

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictId = `SELECT * FROM district WHERE district.district_id = '${districtId}';`;
  const districtArray = await db.get(getDistrictId);
  response.send(convertDbDistrictObjectToResponseObject(districtArray));
});

//DELETE API5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictArray = `DELETE FROM district WHERE district_id = '${districtId}';`;
  await db.run(deleteDistrictArray);
  response.send("District Removed");
});

//PUT API6

app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const updateDistrictArray = `UPDATE district
                                 SET district_name='${districtName}',state_id='${stateId}',cases='${cases}',cured='${cured}',active='${active}',deaths='${deaths}'
                                 WHERE district_id = '${districtId}';`;
  await db.run(updateDistrictArray);
  response.send("District Details Updated");
});

//GET API7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatics = `SELECT SUM(cases) AS totalCases,SUM(cured) AS totalCured,SUM(active) AS totalActive,SUM(deaths) AS totalDeaths FROM state NATURAL JOIN district WHERE state_id=${stateId};`;
  const stateStatics = await db.get(getStateStatics);
  response.send(stateStatics);
});

//GET API8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNames = `SELECT state_name AS stateName FROM state NATURAL JOIN district WHERE district_id='${districtId}';`;
  const stateNames = await db.get(getStateNames);
  response.send(stateNames);
});

module.exports = app;
