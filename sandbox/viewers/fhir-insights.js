/* Plain-English Insights for FHIR R4 elements. Original wording; cites hl7.org/fhir/R4. */
window.FHIR_INSIGHTS = {
  _default: {
    title: 'FHIR element',
 what: 'Click a node in the tree for a plain-English note: what it is, common values, and mistakes we see on training feeds ( Penford data only).',
    values: '', mistakes: '',
    spec: { label: 'FHIR R4 specification', href: 'https://hl7.org/fhir/R4/' }
  },
  'resourceType': { title: 'resourceType', what: 'Declares which FHIR resource this JSON document is. Parsers and servers route on this string.', values: 'Patient, Encounter, Observation, Bundle, OperationOutcome…', mistakes: 'Typos (patient vs Patient) or omitting it so the server returns 400.', spec: { label: 'FHIR R4 — Resource', href: 'https://hl7.org/fhir/R4/resource.html' } },
 'id': { title: 'id — Logical id', what: 'Server-assigned id used in the resource URL. Clients usually do not mint this on create.', values: 'pmc-maya style ids in Penford examples are.', mistakes: 'Putting a business MRN in id instead of in identifier; colliding ids across resource types is fine, colliding within one type is not.', spec: { label: 'FHIR R4 — Resource.id', href: 'https://hl7.org/fhir/R4/resource.html#id' } },
  'meta': { title: 'meta', what: 'Metadata: versionId, lastUpdated, profiles, security labels, tags.', values: 'profile often lists a US Core or implementation-guide canonical URL.', mistakes: 'Forgetting a required profile when the server enforces an IG.', spec: { label: 'FHIR R4 — Meta', href: 'https://hl7.org/fhir/R4/resource.html#meta' } },
  'identifier': { title: 'identifier', what: 'Business identifiers (MRN, SSN, encounter number) as Identifier datatypes — system + value.', values: 'Use a real assigning-authority URI in system when you can.', mistakes: 'Value without system; using display text as the system URL.', spec: { label: 'FHIR R4 — Identifier', href: 'https://hl7.org/fhir/R4/datatypes.html#Identifier' } },
  'Patient': { title: 'Patient', what: 'Demographics and administrative information for a person receiving care.', values: 'Core for almost every clinical workflow.', mistakes: 'Stuffing encounter location into Patient; use Encounter for the visit.', spec: { label: 'FHIR R4 — Patient', href: 'https://hl7.org/fhir/R4/patient.html' } },
  'Patient.name': { title: 'Patient.name', what: 'HumanName list: family, given, use (official, usual…).', values: 'Official name is what registration treats as legal.', mistakes: 'Single string in family that still contains a comma; omitting given when the IG requires it.', spec: { label: 'FHIR R4 — HumanName', href: 'https://hl7.org/fhir/R4/datatypes.html#HumanName' } },
  'Patient.gender': { title: 'Patient.gender', what: 'Administrative gender for this record (not a full clinical gender-identity model).', values: 'male | female | other | unknown', mistakes: 'Sending M/F (v2 codes) or localized words; map before you POST.', spec: { label: 'FHIR R4 — Patient.gender', href: 'https://hl7.org/fhir/R4/patient-definitions.html#Patient.gender' } },
  'Patient.birthDate': { title: 'Patient.birthDate', what: 'Date of birth as FHIR date (YYYY-MM-DD).', values: '1990-05-04', mistakes: 'YYYYMMDD (v2 style) or US slash dates — FHIR JSON wants ISO dates.', spec: { label: 'FHIR R4 — date', href: 'https://hl7.org/fhir/R4/datatypes.html#date' } },
 'Patient.identifier': { title: 'Patient.identifier', what: 'MRNs and other patient ids. Prefer typed identifiers with system URIs.', values: 'Penford training uses a MRN system URI.', mistakes: 'Putting the MRN only in id; duplicate identifiers with different systems that actually mean the same number.', spec: { label: 'FHIR R4 — Patient.identifier', href: 'https://hl7.org/fhir/R4/patient-definitions.html#Patient.identifier' } },
  'Bundle': { title: 'Bundle', what: 'A package of resources: searchset, transaction, batch, history, or document.', values: 'type is required; entry[].resource holds the members.', mistakes: 'Using collection when the server expects transaction; forgetting fullUrl on transaction entries.', spec: { label: 'FHIR R4 — Bundle', href: 'https://hl7.org/fhir/R4/bundle.html' } },
  'Bundle.type': { title: 'Bundle.type', what: 'Why this bundle exists — search results vs a transaction to commit, etc.', values: 'document | message | transaction | transaction-response | batch | batch-response | history | searchset | collection', mistakes: 'Posting a searchset to a transaction endpoint.', spec: { label: 'FHIR R4 — Bundle.type', href: 'https://hl7.org/fhir/R4/bundle-definitions.html#Bundle.type' } },
  'Bundle.entry': { title: 'Bundle.entry', what: 'One slot in the bundle: optional fullUrl, resource, search/request/response.', values: 'Searchsets fill search.mode; transactions fill request.method/url.', mistakes: 'Missing request on a transaction entry; absolute fullUrl that does not match the server base.', spec: { label: 'FHIR R4 — Bundle.entry', href: 'https://hl7.org/fhir/R4/bundle-definitions.html#Bundle.entry' } },
  'Observation': { title: 'Observation', what: 'A measurement or assertion: labs, vitals, social history, etc.', values: 'code + value[x] + status are the usual core.', mistakes: 'Putting the numeric value in valueString while unit lives nowhere; prefer valueQuantity.', spec: { label: 'FHIR R4 — Observation', href: 'https://hl7.org/fhir/R4/observation.html' } },
  'Observation.code': { title: 'Observation.code', what: 'What was observed, as a CodeableConcept (often LOINC).', values: 'coding[].system + code + display', mistakes: 'Display-only concepts with no code; wrong system URI for LOINC.', spec: { label: 'FHIR R4 — Observation.code', href: 'https://hl7.org/fhir/R4/observation-definitions.html#Observation.code' } },
  'Observation.status': { title: 'Observation.status', what: 'Lifecycle of the result (registered, preliminary, final…).', values: 'registered | preliminary | final | amended | corrected | cancelled | entered-in-error | unknown', mistakes: 'Leaving draft results as final; clients that only read final will miss prelims you meant to show.', spec: { label: 'FHIR R4 — ObservationStatus', href: 'https://hl7.org/fhir/R4/valueset-observation-status.html' } },
  'Encounter': { title: 'Encounter', what: 'An interaction between a patient and healthcare — visit, admission, telehealth session.', values: 'class and status are widely required by IGs.', mistakes: 'Encoding the whole visit only as Patient.address or an Observation.', spec: { label: 'FHIR R4 — Encounter', href: 'https://hl7.org/fhir/R4/encounter.html' } },
  'OperationOutcome': { title: 'OperationOutcome', what: 'How a server explains success-with-notes or a failure — issues with severity, code, and diagnostics.', values: 'Returned on many 4xx/5xx responses and some 2xx with warnings.', mistakes: 'Ignoring issue.diagnostics and only reading the HTTP status line.', spec: { label: 'FHIR R4 — OperationOutcome', href: 'https://hl7.org/fhir/R4/operationoutcome.html' } },
  'issue': { title: 'OperationOutcome.issue', what: 'One problem or note: severity, code, details, diagnostics, expression/location.', values: 'severity: fatal | error | warning | information', mistakes: 'Treating every information issue as a hard failure — check severity.', spec: { label: 'FHIR R4 — OperationOutcome.issue', href: 'https://hl7.org/fhir/R4/operationoutcome-definitions.html#OperationOutcome.issue' } }
};
window.fhirInsight = function(path){
  const cat = window.FHIR_INSIGHTS;
  if (!path) return cat._default;
  if (cat[path]) return cat[path];
  // try resource-qualified and last segment
  const parts = String(path).split('.');
  for (let i=0;i<parts.length;i++){
    const cand = parts.slice(i).join('.');
    if (cat[cand]) return Object.assign({}, cat[cand], { title: cat[cand].title + (cand!==path?' · '+path:'') });
  }
  if (cat[parts[0]]) return Object.assign({}, cat[parts[0]], { title: path });
  return Object.assign({}, cat._default, { title: path });
};
