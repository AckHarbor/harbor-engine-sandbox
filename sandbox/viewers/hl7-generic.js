/* HL7 v2 viewer core, shared by AckHarbor Spyglass (public HL7 v2 viewer), the Sandbox's offline copy and the Spyglass tab in Harbor Engine
   (the same shape as fhir-generic.js: SAMPLES, tree, check, note). Field and data-type component names follow
   HL7 v2.5.1 (Chapters 2, 3, 4, 6, 7, 9, 10). Samples are Penford training data: no real patients. */
(function(){
const N = {
 MSH:{1:'Field separator',2:'Encoding characters',3:'Sending application',4:'Sending facility',5:'Receiving application',6:'Receiving facility',7:'Date/time of message',8:'Security',9:'Message type (message code ^ trigger event ^ message structure)',10:'Message control ID (echoed in MSA-2)',11:'Processing ID (P production, T training, D debugging)',12:'Version ID',13:'Sequence number',15:'Accept acknowledgment type',16:'Application acknowledgment type',17:'Country code',18:'Character set',21:'Message profile identifier'},
 EVN:{1:'Event type code (backward-compatible copy of the trigger)',2:'Recorded date/time',3:'Date/time planned event',4:'Event reason code',5:'Operator ID',6:'Event occurred',7:'Event facility'},
 PID:{1:'Set ID',2:'Patient ID (backward-compatible only)',3:'Patient identifier list',4:'Alternate patient ID (backward-compatible only)',5:'Patient name',6:'Mother\'s maiden name',7:'Date/time of birth',8:'Administrative sex (table 0001)',9:'Patient alias',10:'Race',11:'Patient address',12:'County code',13:'Phone number - home',14:'Phone number - business',15:'Primary language',16:'Marital status',17:'Religion',18:'Patient account number',19:'SSN number (backward-compatible only)',22:'Ethnic group',23:'Birth place',24:'Multiple birth indicator',29:'Patient death date and time',30:'Patient death indicator'},
 PD1:{3:'Patient primary facility',4:'Patient primary care provider (backward-compatible only)',11:'Publicity code',12:'Protection indicator',16:'Immunization registry status',17:'Immunization registry status effective date'},
 NK1:{1:'Set ID',2:'Name',3:'Relationship (table 0063)',4:'Address',5:'Phone number',6:'Business phone number',7:'Contact role (table 0131)'},
 PV1:{1:'Set ID',2:'Patient class (table 0004)',3:'Assigned patient location',4:'Admission type (table 0007)',5:'Preadmit number',6:'Prior patient location',7:'Attending doctor',8:'Referring doctor',9:'Consulting doctor',10:'Hospital service',14:'Admit source',17:'Admitting doctor',18:'Patient type',19:'Visit number',20:'Financial class',36:'Discharge disposition (table 0112)',37:'Discharged to location',39:'Servicing facility',41:'Account status',44:'Admit date/time',45:'Discharge date/time'},
 PV2:{1:'Prior pending location',3:'Admit reason',8:'Expected admit date/time',9:'Expected discharge date/time',11:'Estimated length of inpatient stay'},
 AL1:{1:'Set ID',2:'Allergen type code (table 0127)',3:'Allergen code/mnemonic/description',4:'Allergy severity code (table 0128)',5:'Allergy reaction code',6:'Identification date'},
 DG1:{1:'Set ID',2:'Diagnosis coding method (backward-compatible only)',3:'Diagnosis code',4:'Diagnosis description (backward-compatible only)',5:'Diagnosis date/time',6:'Diagnosis type (table 0052)',15:'Diagnosis priority',16:'Diagnosing clinician'},
 PR1:{1:'Set ID',3:'Procedure code',5:'Procedure date/time',6:'Procedure functional type'},
 GT1:{1:'Set ID',2:'Guarantor number',3:'Guarantor name',5:'Guarantor address',6:'Guarantor phone number - home',10:'Guarantor type',11:'Guarantor relationship (table 0063)'},
 IN1:{1:'Set ID',2:'Insurance plan ID',3:'Insurance company ID',4:'Insurance company name',8:'Group number',12:'Plan effective date',13:'Plan expiration date',15:'Plan type',16:'Name of insured',17:'Insured\'s relationship to patient (table 0063)',36:'Policy number'},
 MRG:{1:'Prior patient identifier list (the MRN being retired)',3:'Prior patient account number',5:'Prior visit number',7:'Prior patient name'},
 ORC:{1:'Order control (table 0119: NW new, CA cancel request, RE observations to follow…)',2:'Placer order number',3:'Filler order number',4:'Placer group number',5:'Order status (table 0038)',7:'Quantity/timing (backward-compatible only); component 6 = priority',9:'Date/time of transaction',10:'Entered by',12:'Ordering provider',13:'Enterer\'s location',16:'Order control code reason',17:'Entering organization',21:'Ordering facility name'},
 'TQ1':{1:'Set ID',2:'Quantity',7:'Start date/time',8:'End date/time',9:'Priority (table 0485: S stat, A ASAP, R routine)'},
 OBR:{1:'Set ID',2:'Placer order number',3:'Filler order number',4:'Universal service identifier (what was ordered)',5:'Priority (backward-compatible only)',6:'Requested date/time (backward-compatible only)',7:'Observation date/time (collection)',8:'Observation end date/time',13:'Relevant clinical information',16:'Ordering provider',22:'Results rpt/status chng - date/time',24:'Diagnostic serv sect ID (table 0074)',25:'Result status (table 0123: F final, P preliminary, C corrected…)',27:'Quantity/timing (backward-compatible only); component 6 = priority',31:'Reason for study',32:'Principal result interpreter'},
 OBX:{1:'Set ID',2:'Value type (table 0125: NM numeric, ST string, TX text, CE coded…)',3:'Observation identifier (what was measured)',4:'Observation sub-ID',5:'Observation value',6:'Units',7:'References range',8:'Abnormal flags (table 0078: H high, L low, N normal…)',11:'Observation result status (table 0085: F final, P preliminary, C corrected…)',14:'Date/time of the observation',16:'Responsible observer',19:'Date/time of the analysis'},
 NTE:{1:'Set ID',2:'Source of comment (table 0105)',3:'Comment',4:'Comment type'},
 SPM:{1:'Set ID',2:'Specimen ID',4:'Specimen type',17:'Specimen collection date/time'},
 RXE:{1:'Quantity/timing (backward-compatible only); component 6 = priority',2:'Give code (the drug)',3:'Give amount - minimum',4:'Give amount - maximum',5:'Give units',6:'Give dosage form',10:'Dispense amount',11:'Dispense units',21:'Give per (time unit)'},
 RXR:{1:'Route (table 0162)',2:'Administration site (table 0163)',3:'Administration device',4:'Administration method'},
 RXA:{1:'Give sub-ID counter',2:'Administration sub-ID counter',3:'Date/time start of administration',4:'Date/time end of administration',5:'Administered code',6:'Administered amount',7:'Administered units',9:'Administration notes',10:'Administering provider',11:'Administered-at location',15:'Substance lot number',16:'Substance expiration date',17:'Substance manufacturer name',20:'Completion status (table 0322)',21:'Action code - RXA (table 0323)'},
 FT1:{1:'Set ID',2:'Transaction ID',4:'Transaction date',5:'Transaction posting date',6:'Transaction type (table 0017: CG charge, CD credit, PY payment, AJ adjustment)',7:'Transaction code',10:'Transaction quantity',13:'Department code',16:'Assigned patient location',19:'Diagnosis code - FT1',20:'Performed by code',21:'Ordered by code',25:'Procedure code'},
 SCH:{1:'Placer appointment ID',2:'Filler appointment ID',5:'Schedule ID',6:'Event reason',7:'Appointment reason (table 0276)',8:'Appointment type (table 0277)',9:'Appointment duration (backward-compatible only)',10:'Appointment duration units (backward-compatible only)',11:'Appointment timing quantity (backward-compatible only)',16:'Filler contact person',20:'Entered by person',25:'Filler status code (table 0278)'},
 RGS:{1:'Set ID',2:'Segment action code',3:'Resource group ID'},
 AIS:{1:'Set ID',2:'Segment action code',3:'Universal service identifier',4:'Start date/time',7:'Duration',8:'Duration units',10:'Filler status code'},
 AIL:{1:'Set ID',2:'Segment action code',3:'Location resource ID',4:'Location type - AIL',6:'Start date/time',12:'Filler status code'},
 AIP:{1:'Set ID',2:'Segment action code',3:'Personnel resource ID',4:'Resource type',6:'Start date/time',12:'Filler status code'},
 TXA:{1:'Set ID',2:'Document type (table 0270)',3:'Document content presentation (table 0191)',4:'Activity date/time',5:'Primary activity provider code/name',6:'Origination date/time',9:'Originator code/name',12:'Unique document number',17:'Document completion status (table 0271)',19:'Document availability status (table 0273)'},
 MSA:{1:'Acknowledgment code (table 0008: AA accept, AE error, AR reject)',2:'Message control ID being acknowledged (= MSH-10 of the original)',3:'Text message (backward-compatible only)'},
 ERR:{1:'Error code and location (backward-compatible only)',2:'Error location (segment ^ sequence ^ field ^ repetition ^ component)',3:'HL7 error code (table 0357)',4:'Severity (table 0516: E error, W warning, I information)',5:'Application error code',8:'User message'}
};
const SEGN = { MSH:'Message header',EVN:'Event type',PID:'Patient identification',PD1:'Patient additional demographic',NK1:'Next of kin / associated parties',PV1:'Patient visit',PV2:'Patient visit - additional information',AL1:'Patient allergy information',DG1:'Diagnosis',PR1:'Procedures',GT1:'Guarantor',IN1:'Insurance',MRG:'Merge patient information',ORC:'Common order','TQ1':'Timing/quantity',OBR:'Observation request',OBX:'Observation/result',NTE:'Notes and comments',SPM:'Specimen',RXE:'Pharmacy/treatment encoded order',RXR:'Pharmacy/treatment route',RXA:'Pharmacy/treatment administration',FT1:'Financial transaction',SCH:'Scheduling activity information',RGS:'Resource group',AIS:'Appointment information - service',AIL:'Appointment information - location resource',AIP:'Appointment information - personnel resource',TXA:'Transcription document header',MSA:'Message acknowledgment',ERR:'Error' };
/* Data types of composite fields, for naming components (v2.5.1 Chapter 2A) */
const DT = { HD:['Namespace ID','Universal ID','Universal ID type'], MSG:['Message code','Trigger event','Message structure'], VID:['Version ID','Internationalization code','International version ID'], PT:['Processing ID','Processing mode'],
 CX:['ID number','Check digit','Check digit scheme','Assigning authority','Identifier type code (table 0203)','Assigning facility'], XPN:['Family name','Given name','Second and further given names or initials','Suffix','Prefix','Degree','Name type code (table 0200)'],
 XAD:['Street address','Other designation','City','State or province','Zip or postal code','Country','Address type (table 0190)'], XTN:['Telephone number (backward-compatible only)','Telecommunication use code (table 0201)','Telecommunication equipment type (table 0202)','Email address','Country code','Area/city code','Local number','Extension'],
 XCN:['ID number','Family name','Given name','Second and further given names or initials','Suffix','Prefix','Degree'], PL:['Point of care','Room','Bed','Facility','Location status','Person location type','Building','Floor'],
 CE:['Identifier','Text','Name of coding system','Alternate identifier','Alternate text','Name of alternate coding system'], CWE:['Identifier','Text','Name of coding system','Alternate identifier','Alternate text','Name of alternate coding system'],
 EI:['Entity identifier','Namespace ID','Universal ID','Universal ID type'], TQ:['Quantity','Interval','Duration','Start date/time','End date/time','Priority'], ERL:['Segment ID','Segment sequence','Field position','Field repetition','Component number','Sub-component number'],
 CQ:['Quantity','Units'], SN:['Comparator','Num1','Separator/suffix','Num2'], DLD:['Discharge location','Effective date'], FC:['Financial class code','Effective date'] };
const FT = { 'MSH-3':'HD','MSH-4':'HD','MSH-5':'HD','MSH-6':'HD','MSH-9':'MSG','MSH-11':'PT','MSH-12':'VID','EVN-5':'XCN','EVN-7':'HD','PID-3':'CX','PID-5':'XPN','PID-6':'XPN','PID-10':'CE','PID-11':'XAD','PID-13':'XTN','PID-14':'XTN','PID-15':'CE','PID-16':'CE','PID-18':'CX','PID-22':'CE',
 'PD1-3':'XON','PD1-4':'XCN','NK1-2':'XPN','NK1-3':'CE','NK1-4':'XAD','NK1-5':'XTN','NK1-7':'CE','PV1-3':'PL','PV1-6':'PL','PV1-7':'XCN','PV1-8':'XCN','PV1-9':'XCN','PV1-17':'XCN','PV1-19':'CX','PV1-20':'FC','PV1-37':'DLD','PV2-3':'CE','AL1-3':'CE','AL1-4':'CE','AL1-2':'CE','DG1-3':'CE','DG1-16':'XCN','PR1-3':'CE','GT1-3':'XPN','GT1-5':'XAD','GT1-6':'XTN',
 'IN1-2':'CE','IN1-3':'CX','IN1-16':'XPN','IN1-17':'CE','MRG-1':'CX','MRG-3':'CX','MRG-5':'CX','MRG-7':'XPN','ORC-2':'EI','ORC-3':'EI','ORC-4':'EI','ORC-7':'TQ','ORC-10':'XCN','ORC-12':'XCN','ORC-16':'CE','ORC-17':'CE','TQ1-2':'CQ','OBR-2':'EI','OBR-3':'EI','OBR-4':'CE','OBR-16':'XCN','OBR-27':'TQ','OBR-31':'CE',
 'OBX-3':'CE','OBX-6':'CE','OBX-16':'XCN','SPM-2':'EI','SPM-4':'CWE','RXE-1':'TQ','RXE-2':'CE','RXE-5':'CE','RXE-6':'CE','RXR-1':'CE','RXR-2':'CWE','RXA-5':'CE','RXA-7':'CE','RXA-9':'CE','RXA-10':'XCN','RXA-17':'CE','FT1-7':'CE','FT1-19':'CE','FT1-20':'XCN','FT1-21':'XCN','FT1-25':'CE','FT1-16':'PL',
 'SCH-1':'EI','SCH-2':'EI','SCH-6':'CE','SCH-7':'CE','SCH-8':'CE','SCH-10':'CE','SCH-11':'TQ','SCH-16':'XCN','SCH-20':'XCN','SCH-25':'CE','AIS-3':'CE','AIS-8':'CE','AIL-3':'PL','AIL-4':'CE','AIP-3':'XCN','AIP-4':'CE','TXA-5':'XCN','TXA-9':'XCN','TXA-12':'EI','ERR-2':'ERL','ERR-3':'CWE','ERR-5':'CWE' };
const fieldName = (seg, f) => (N[seg] && N[seg][f]) || (/^Z/.test(seg) ? 'Local Z-segment field: its meaning comes from the sender\'s interface specification, not the HL7 standard' : '');
const compName = (seg, f, c) => { const t = FT[seg + '-' + f]; return (t && DT[t] && DT[t][c-1]) || ''; };
/* Build a segment from {field number: value} so field positions are always right */
const S = (id, o) => { const n = Math.max(0, ...Object.keys(o).map(Number)); const a = []; for (let i = 1; i <= n; i++) a.push(o[i] == null ? '' : o[i]); return id + '|' + a.join('|'); };
const H = (snd, ts, type, id) => 'MSH|^~\\&|' + snd + '|PMC|HARBORENGINE|PMC|' + ts + '||' + type + '|' + id + '|P|2.5.1';
const PIDM = 'PID|1||10028471^^^PMC^MR||Chen^Maya^Lin||19880314|F|||22 Mercer St^^Penford^NJ^00000^USA^H||^PRN^PH^^^555^5550148|||||A7001001^^^PMC^AN';
const PIDS = 'PID|1||10028471^^^PMC^MR||Chen^Maya^Lin||19880314|F';
const DOC = '2201^Patel^Anika^^^Dr';
const M = (...l) => l.join('\r');
const SAMPLES = {
 'ADT^A01 admit (inpatient)': M(H('PENEHR','20261014083015-0400','ADT^A01^ADT_A01','PMC-ADT-0001'), 'EVN||20261014083000-0400|||kjames^James^Kim', PIDM,
   'NK1|1|Chen^Wei|SPO^Spouse^HL70063|22 Mercer St^^Penford^NJ^00000|^PRN^PH^^^555^5550149|',
   S('PV1',{1:1,2:'I',3:'4W^412^B^PMC',4:'U',7:DOC,10:'MED',14:'7',17:DOC,19:'V2104418^^^PMC^VN',44:'20261014082500-0400'}),
   'PV2|||R07.9^Chest pain, unspecified^I10', 'DG1|1||R07.9^Chest pain, unspecified^I10||20261014082500-0400|A', 'AL1|1|DA^Drug allergy^HL70127|PCN^Penicillin^L|MO^Moderate^HL70128|Hives',
   S('IN1',{1:1,2:'PPO100^Penford PPO^L',3:'HARBORHP^^^PMC^NIIP',4:'Harbor Health Plan',8:'GRP4410',12:'20260101',15:'PPO',16:'Chen^Maya^Lin',17:'SEL^Self^HL70063',36:'HHP55012871'})),
 'ADT^A02 transfer': M(H('PENEHR','20261014140210-0400','ADT^A02^ADT_A02','PMC-ADT-0002'), 'EVN||20261014140200-0400|||kjames^James^Kim', PIDS,
   S('PV1',{1:1,2:'I',3:'ICU^03^A^PMC',6:'4W^412^B^PMC',7:DOC,10:'MED',19:'V2104418^^^PMC^VN',44:'20261014082500-0400'})),
 'ADT^A03 discharge': M(H('PENEHR','20261016111530-0400','ADT^A03^ADT_A03','PMC-ADT-0003'), 'EVN||20261016111500-0400|||kjames^James^Kim', PIDS,
   S('PV1',{1:1,2:'I',3:'4W^412^B^PMC',7:DOC,10:'MED',19:'V2104418^^^PMC^VN',36:'01',44:'20261014082500-0400',45:'20261016110000-0400'}), 'DG1|1||I20.0^Unstable angina^I10||20261016110000-0400|F'),
 'ADT^A04 outpatient registration': M(H('PENEHR','20261014160512-0400','ADT^A04^ADT_A01','PMC-ADT-0004'), 'EVN||20261014160455-0400|||kjames^James^Kim', PIDM,
   S('PV1',{1:1,2:'O',3:'NCLINIC^^^PMC',7:DOC,10:'FAM',19:'V2104511^^^PMC^VN',44:'20261014160000-0400'}), 'ZPI|1|Prefers text reminders|Y'),
 'ADT^A08 update patient information': M(H('PENEHR','20261014171205-0400','ADT^A08^ADT_A01','PMC-ADT-0008'), 'EVN||20261014171200-0400|||kjames^James^Kim',
   'PID|1||10028471^^^PMC^MR||Chen^Maya^Lin||19880314|F|||7 Quay Ln^Apt 2^Penford^NJ^00000^USA^H||^PRN^PH^^^555^5550177|||||A7001001^^^PMC^AN',
   S('PV1',{1:1,2:'I',3:'4W^412^B^PMC',7:DOC,10:'MED',19:'V2104418^^^PMC^VN'})),
 'ADT^A11 cancel admit': M(H('PENEHR','20261014090105-0400','ADT^A11^ADT_A09','PMC-ADT-0011'), 'EVN||20261014090100-0400|||kjames^James^Kim', 'PID|1||10044120^^^PMC^MR||Nguyen^Tam||19700512|M',
   S('PV1',{1:1,2:'I',3:'4W^415^A^PMC',7:DOC,19:'V2104520^^^PMC^VN'})),
 'ADT^A31 update person information': M(H('PENEHR','20261014101500-0400','ADT^A31^ADT_A05','PMC-ADT-0031'), 'EVN||20261014101500-0400|||kjames^James^Kim',
   'PID|1||10044120^^^PMC^MR||Nguyen^Tam||19700512|M|||91 Pier Rd^^Penford^NJ^00000^USA^H||^PRN^PH^^^555^5550133', 'PV1|1|N'),
 'ADT^A40 merge patient (MRG)': M(H('PENEHR','20261014113000-0400','ADT^A40^ADT_A39','PMC-ADT-0040'), 'EVN||20261014113000-0400|||kjames^James^Kim', PIDS, 'MRG|10031122^^^PMC^MR'),
 'ORM^O01 new lab order': M(H('PENEHR','20261014162210-0400','ORM^O01^ORM_O01','PMC-ORM-0001'), PIDS, S('PV1',{1:1,2:'E',3:'ED^12^A^PMC',19:'V2104418^^^PMC^VN'}),
   S('ORC',{1:'NW',2:'ORD55120^PENEHR',5:'SC',7:'^^^^^S',9:'20261014162200-0400',12:DOC}),
   S('OBR',{1:1,2:'ORD55120^PENEHR',4:'10839-9^Troponin I.cardiac [Mass/volume] in Serum or Plasma^LN',7:'20261014162200-0400',16:DOC,24:'CH',27:'^^^^^S'}), 'NTE|1|P|Chest pain started 2 hours ago'),
 'ORM^O01 cancel order (ORC-1 CA)': M(H('PENEHR','20261014163005-0400','ORM^O01^ORM_O01','PMC-ORM-0002'), PIDS,
   S('ORC',{1:'CA',2:'ORD55120^PENEHR',9:'20261014163000-0400',12:DOC,16:'DUP^Duplicate order^L'}), S('OBR',{1:1,2:'ORD55120^PENEHR',4:'10839-9^Troponin I.cardiac [Mass/volume] in Serum or Plasma^LN'})),
 'ORU^R01 lab result (panel)': M(H('HARBORLAB','20261014171503-0400','ORU^R01^ORU_R01','HL-883104'), PIDS, S('PV1',{1:1,2:'E',3:'ED^12^A^PMC',19:'V2104418^^^PMC^VN'}),
   S('ORC',{1:'RE',2:'ORD55121^PENEHR',3:'F77310^HARBORLAB',12:DOC}),
   S('OBR',{1:1,2:'ORD55121^PENEHR',3:'F77310^HARBORLAB',4:'BMP^Basic metabolic panel^L',7:'20261014163000-0400',16:DOC,22:'20261014171500-0400',24:'CH',25:'F'}),
   'OBX|1|NM|2951-2^Sodium [Moles/volume] in Serum or Plasma^LN||139|mmol/L^^UCUM|136-145|N|||F|||20261014163000-0400',
   'OBX|2|NM|2823-3^Potassium [Moles/volume] in Serum or Plasma^LN||5.4|mmol/L^^UCUM|3.5-5.1|H|||F|||20261014163000-0400', 'NTE|1|L|Slight hemolysis; potassium may read high.',
   'OBX|3|NM|2345-7^Glucose [Mass/volume] in Serum or Plasma^LN||98|mg/dL^^UCUM|70-99|N|||F|||20261014163000-0400',
   'OBX|4|NM|2160-0^Creatinine [Mass/volume] in Serum or Plasma^LN||0.8|mg/dL^^UCUM|0.6-1.1|N|||F|||20261014163000-0400'),
 'ORU^R01 imaging report (text)': M(H('PENRAD','20261014183011-0400','ORU^R01^ORU_R01','RAD-20931'), PIDS,
   S('OBR',{1:1,2:'ORD55140^PENEHR',3:'R33019^PENRAD',4:'XRCH2^Chest X-ray, 2 views^L',7:'20261014174000-0400',16:DOC,22:'20261014183000-0400',24:'RAD',25:'F',32:'3105&Okafor&Ben'}),
   'OBX|1|TX|IMP^Impression^L|1|No acute cardiopulmonary abnormality.||||||F', 'OBX|2|TX|IMP^Impression^L|2|Heart size normal. Lungs clear.||||||F'),
 'RDE^O11 pharmacy order': M(H('PENEHR','20261014190210-0400','RDE^O11^RDE_O11','PMC-RDE-0001'), PIDS, S('PV1',{1:1,2:'I',3:'4W^412^B^PMC',7:DOC,19:'V2104418^^^PMC^VN'}),
   'AL1|1|DA^Drug allergy^HL70127|PCN^Penicillin^L|MO^Moderate^HL70128|Hives', S('ORC',{1:'NW',2:'RX88120^PENEHR',9:'20261014190200-0400',12:DOC}), 'TQ1|1||||||20261014200000-0400||R',
   'RXE|^^^^^R|PANT40^Pantoprazole 40 mg tablet^L|40||mg^^UCUM|TAB^Tablet^HL70292', 'RXR|PO^Oral^HL70162'),
 'SIU^S12 new appointment': M(H('PENSCHED','20261014120001-0400','SIU^S12^SIU_S12','SCH-40021'),
   S('SCH',{1:'APT7781^PENEHR',2:'APT7781^PENSCHED',6:'NEW^New appointment^L',7:'FOLLOWUP^A follow up visit from a previous appointment^HL70276',8:'NORMAL^Routine schedule request type^HL70277',16:DOC,20:'kjames^James^Kim',25:'Booked^Booked^HL70278'}),
   PIDS, 'RGS|1|A', S('AIS',{1:1,2:'A',3:'FUV^Follow-up visit^L',4:'20261021093000-0400',7:20,8:'min^^UCUM'}), S('AIL',{1:1,2:'A',3:'NCLINIC^^^PMC'}), S('AIP',{1:1,2:'A',3:DOC,4:'MD^Physician^L'})),
 'SIU^S15 cancel appointment': M(H('PENSCHED','20261015081205-0400','SIU^S15^SIU_S12','SCH-40388'),
   S('SCH',{1:'APT7781^PENEHR',2:'APT7781^PENSCHED',6:'PATREQ^Patient request^L',7:'FOLLOWUP^A follow up visit from a previous appointment^HL70276',16:DOC,20:'kjames^James^Kim',25:'Cancelled^Cancelled^HL70278'}),
   PIDS, 'RGS|1|D', S('AIS',{1:1,2:'D',3:'FUV^Follow-up visit^L',4:'20261021093000-0400'})),
 'MDM^T02 document (discharge summary)': M(H('PENTRANS','20261016121510-0400','MDM^T02^MDM_T02','DOC-77120'), 'EVN||20261016121500-0400', PIDS, S('PV1',{1:1,2:'I',3:'4W^412^B^PMC',19:'V2104418^^^PMC^VN'}),
   S('TXA',{1:1,2:'DS',3:'TX',4:'20261016120000-0400',5:DOC,12:'DOC77120^PENTRANS',17:'AU',19:'AV'}),
   'OBX|1|TX|DS^Discharge summary^L||Admitted with chest pain. Troponin negative x2. Discharged home on aspirin.||||||F'),
 'DFT^P03 charge': M(H('PENEHR','20261014180055-0400','DFT^P03^DFT_P03','PMC-DFT-0001'), 'EVN||20261014180050-0400', PIDM, S('PV1',{1:1,2:'E',3:'ED^12^A^PMC',19:'V2104418^^^PMC^VN'}),
   S('FT1',{1:1,4:'20261014174000-0400',6:'CG',7:'71046^Radiologic examination, chest; 2 views^C4',10:1,19:'R07.9^Chest pain, unspecified^I10',25:'71046^Radiologic examination, chest; 2 views^C4'})),
 'BAR^P01 add patient account': M(H('PENEHR','20261014083120-0400','BAR^P01^BAR_P01','PMC-BAR-0001'), 'EVN||20261014083100-0400', PIDM, S('PV1',{1:1,2:'I',3:'4W^412^B^PMC',19:'V2104418^^^PMC^VN',20:'C'}),
   'DG1|1||R07.9^Chest pain, unspecified^I10||20261014082500-0400|A', S('GT1',{1:1,3:'Chen^Maya^Lin',5:'22 Mercer St^^Penford^NJ^00000^USA^H',11:'SEL^Self^HL70063'}),
   S('IN1',{1:1,2:'PPO100^Penford PPO^L',3:'HARBORHP^^^PMC^NIIP',4:'Harbor Health Plan',16:'Chen^Maya^Lin',17:'SEL^Self^HL70063',36:'HHP55012871'})),
 'VXU^V04 immunization': M(H('PENEHR','20261014104500-0400','VXU^V04^VXU_V04','PMC-VXU-0001'), 'PID|1||10052210^^^PMC^MR||Okafor^Ada||20180305|F',
   S('ORC',{1:'RE',3:'IZ55120^PENEHR',12:DOC}),
   S('RXA',{1:0,2:1,3:'20261014103000-0400',5:'141^Influenza, seasonal, injectable^CVX',6:'0.5',7:'mL^^UCUM',9:'00^New immunization record^NIP001',10:DOC,15:'LOT4471A',16:'20270630',20:'CP',21:'A'}),
   'RXR|C28161^Intramuscular^NCIT|LD^Left Deltoid^HL70163'),
 'ACK (AA accept)': M(H('PENLAB','20261014083016-0400','ACK^A01^ACK','PL-77001'), 'MSA|AA|PMC-ADT-0001'),
 'ACK (AE error with ERR)': M(H('PENFIN','20261014180102-0400','ACK^P03^ACK','PF-20931'), 'MSA|AE|PMC-DFT-0002', 'ERR||PID^1^18|101^Required field missing^HL70357|E||||Patient account number required')
};
/* Rows of the tree: segment (depth 0) → field (1) → repetition (2) → component (2 or 3) → subcomponent. */
function tree(raw){ const m = hl7Parse(raw); const rows = []; if (!m.ok) return rows; const cnt = {};
  m.segs.forEach((s, si) => { cnt[s.id] = (cnt[s.id]||0) + 1; const sp = cnt[s.id] > 1 ? s.id + '[' + cnt[s.id] + ']' : s.id;
    rows.push({ path: sp, key: s.id, name: sp, label: SEGN[s.id] || (/^Z/.test(s.id) ? 'Local Z-segment' : ''), depth: 0, leaf: false, seg: s.id, si, value: s.fields.filter(x => x !== '').length + ' of ' + s.fields.length + ' fields' });
    s.fields.forEach((f, fi) => { const fn = fi + 1; if (f === '') return; const fk = s.id + '-' + fn, fp = sp + '-' + fn;
      const raw1 = s.id === 'MSH' && fn <= 2; const reps = raw1 ? [f] : String(f).split(m.d.rep);
      const compRows = (rep, base, depth) => { const cs = raw1 ? [rep] : String(rep).split(m.d.comp); if (cs.length < 2) return;
        cs.forEach((c, ci) => { if (c === '') return; const sub = String(c).split(m.d.sub);
          rows.push({ path: base + '.' + (ci+1), key: fk + '.' + (ci+1), name: base.replace(/^.*?-/, s.id + '-') + '.' + (ci+1), label: compName(s.id, fn, ci+1), depth, leaf: sub.length < 2, seg: s.id, field: fk, value: c });
          if (sub.length > 1) sub.forEach((x, xi) => { if (x !== '') rows.push({ path: base + '.' + (ci+1) + '.' + (xi+1), key: fk + '.' + (ci+1) + '.' + (xi+1), name: s.id + '-' + fn + '.' + (ci+1) + '.' + (xi+1), label: 'Subcomponent ' + (xi+1), depth: depth + 1, leaf: true, seg: s.id, field: fk, value: x }); }); }); };
      const multi = reps.length > 1, comp = !raw1 && reps.some(r => String(r).split(m.d.comp).length > 1);
      rows.push({ path: fp, key: fk, name: fk, label: fieldName(s.id, fn), depth: 1, leaf: !multi && !comp, seg: s.id, field: fk, value: f });
      if (multi) reps.forEach((r, ri) => { if (r === '') return; const rp = fp + '[' + (ri+1) + ']'; const c2 = String(r).split(m.d.comp).length > 1;
        rows.push({ path: rp, key: fk, name: fk + '[' + (ri+1) + ']', label: 'Repetition ' + (ri+1) + ' (split by ' + m.d.rep + ')', depth: 2, leaf: !c2, seg: s.id, field: fk, value: r }); compRows(r, rp, 3); });
      else compRows(reps[0], fp, 2); }); });
  return rows; }
/* Validation (shared with the engine: hl7Validate in engine.js) as [severity, location, message] like FHIRG.check */
function check(raw){ const m = hl7Parse(raw); return hl7Validate(m).map(e => [e.sev, e.loc || '', e.msg]); }
/* Plain-English note: the curated Insight when there is one, else the v2.5.1 field / component name */
function note(row){ const cat = window.HL7_INSIGHTS || {}; const fk = row.field || row.key; const k = row.key;
  const sec = { MSH:'2',EVN:'3',PID:'3',PD1:'3',NK1:'3',PV1:'3',PV2:'3',AL1:'3',DG1:'6',PR1:'6',GT1:'6',IN1:'6',MRG:'3',ORC:'4','TQ1':'4',OBR:'4',OBX:'7',NTE:'2',SPM:'7',RXE:'4',RXR:'4',RXA:'4',FT1:'6',SCH:'10',RGS:'10',AIS:'10',AIL:'10',AIP:'10',TXA:'9',MSA:'2',ERR:'2' }[row.seg];
  const spec = { label: 'HL7 v2.5.1' + (sec ? ' Ch. ' + sec : '') + ' — ' + (row.depth ? fk : row.seg), href: 'https://www.hl7.org/implement/standards/product_brief.cfm?product_id=144' };
  const info = cat[k] || (row.depth >= 1 && cat[fk]) || (row.depth === 0 && cat[row.seg]);
  if (info) return Object.assign({ spec }, info, { title: info.title + (row.depth > 1 ? ' · ' + row.name : '') });
  const fname = row.field ? fieldName(row.seg, +row.field.split('-')[1]) : '';
  const what = row.depth === 0 ? (SEGN[row.seg] ? 'The ' + SEGN[row.seg] + ' segment (' + row.seg + '). Tap a field below it for its name and parts.' : /^Z/.test(row.seg) ? 'A local Z-segment: not part of the HL7 standard. Its fields are defined by the sender\'s interface specification.' : 'Segment ' + row.seg + '.')
    : (row.label ? row.label + (row.depth > 1 && fname ? ', part of ' + fk + ' (' + fname + ')' : '') + '.' : 'Field ' + row.name + '.') + ' Value: ' + row.value;
  return { title: (row.label && row.depth ? row.label + ' · ' : '') + row.name, what, spec }; }
window.HL7G = { SAMPLES, tree, check, note, N, SEGN, fieldName, compName };
})();
