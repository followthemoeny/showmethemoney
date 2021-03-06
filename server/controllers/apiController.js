const fetch = require('node-fetch');

const { google, proPublica, fec } = require('../../secret');
const { resource } = require('../index');

const apiController = {};

apiController.getElectionInfo = (req, res, next) => {
  const { address } = req.query;
  if (!address) return res.sendStatus(400);
  fetch(`https://www.googleapis.com/civicinfo/v2/voterinfo?key=${google}&address=${address}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.error) return next(data.error.message);
      const { election, pollingLocations, contests, normalizedInput } = data;
      const electionObj = { normalizedInput, ...election, pollingLocations };
      if (contests) electionObj.contests = contests;
      res.locals.elections = electionObj;
      return next();
    })
    .catch((error) => {
      return next(error);
    });
};

apiController.getRepresentatives = (req, res, next) => {
  const { address } = req.query;
  if (!address) res.sendStatus(400);

  fetch(`https://www.googleapis.com/civicinfo/v2/representatives?key=${google}&address=${address}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.error) return next(data.error.message);
      const { offices, officials, normalizedInput } = data;
      const reps = [];
      offices.forEach((elem) => {
        elem.officialIndices.forEach((index) => {
          reps.push({ ...officials[index], position: elem.name });
        });
      });
      res.locals.representatives = { normalizedInput, officials: reps };
      return next();
    })
    .catch((error) => next(error));
};

apiController.getCandidateInfo = async (req, res, next) => {
  const { name, state } = req.query;
  let url = `https://api.open.fec.gov/v1/candidates/search/?sort_null_only=false&name=${name}&sort=name&page=1&sort_hide_null=false&sort_nulls_last=false&api_key=${fec}&per_page=20`;
  if (state) url += `&state=${state}`;
  if (!name) return res.sendStatus(400);
  const candidateResp = await fetch(url);
  const data = await candidateResp.json();
  if (data.error) return next(data.error.message);
  if (!data.results.length) return res.sendStatus(404);
  const { candidate_id, principal_committees } = data.results[0];
  const { committee_id } = principal_committees[0];
  const financeResp = await fetch(`https://api.open.fec.gov/v1/candidate/${candidate_id}/totals/?sort=-cycle&api_key=${fec}&sort_nulls_last=false&page=1&election_full=true&sort_hide_null=false&sort_null_only=false&per_page=20
  `);
  const committeeResp = await fetch(`https://api.open.fec.gov/v1/committee/${committee_id}/totals/?sort=-cycle&api_key=${fec}&sort_nulls_last=false&page=1&sort_hide_null=false&sort_null_only=false&per_page=20
  `);
  const financeData = await financeResp.json();
  const committeeData = await committeeResp.json();
  if (financeData.error) return next(data.error.message);
  [res.locals.finance] = financeData.results;
  if (!committeeData.error) {
    res.locals.finance.committees = committeeData.results;
  }
  return next();
};

module.exports = apiController;
