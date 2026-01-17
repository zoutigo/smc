import { randomUUID } from "node:crypto";
import type { $Enums } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { slugifyValue } from "../lib/utils";

const prisma = new PrismaClient();

const packagingMeanCategoriesSeedData = [
  {
    name: "Trolley",
    description: "Multipurpose trolley designed for quick moves between inbound docks and kitting cells.",
    imageUrl: "https://images.unsplash.com/photo-1502877338535-766e1452684a",
  },
  {
    name: "Kitting Trolley",
    description: "Ergonomic trolley optimized for staging components near assembly lines.",
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  },
  {
    name: "Picking Trolley",
    description: "Narrow footprint trolley used for high-frequency picking runs.",
    imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e",
  },
  {
    name: "Shopstock Hook",
    description: "Heavy-duty hook system that keeps frequently used parts within reach.",
    imageUrl: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef",
  },
  {
    name: "Transtocker Hook",
    description: "Overhead hook compatible with automatic transtockers for fast swaps.",
    imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
  },
  {
    name: "Tallboy",
    description: "Vertical storage tower maximizing cubic efficiency in tight aisles.",
    imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
  },
  {
    name: "HD Rack",
    description: "High-density racking unit supporting palletized and loose packaging.",
    imageUrl: "https://images.unsplash.com/photo-1560464024-54c5c887c1bf",
  },
  {
    name: "Plastic box",
    description: "Durable plastic totes for closed-loop shuttles between suppliers and plant.",
    imageUrl: "https://images.unsplash.com/photo-1454165205744-3b78555e5572",
  },
  {
    name: "High density Tower",
    description: "Automated tower providing dense storage for small packaging assets.",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa",
  },
];

const storageMeanCategoriesSeedData = [
  {
    name: "Automated Hanging Shopstock",
    description: "Robot-managed hanging aisles buffering painted subassemblies with real-time inventory tracking.",
    imageUrl: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a",
  },
  {
    name: "Manual Hanging Shopstock",
    description: "Operator-friendly hanging rails that keep bulky trim sets within reach of assembly teams.",
    imageUrl: "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8",
  },
  {
    name: "Automated Transtocker",
    description: "High-throughput transtockers feeding cells with sequenced components under automated control.",
    imageUrl: "https://images.unsplash.com/photo-1489515215877-9227ee91edef",
  },
  {
    name: "Manual Transtocker",
    description: "Manually dispatched transtockers supporting flexible replenishment during short runs.",
    imageUrl: "https://images.unsplash.com/photo-1452698325353-b89e0069974b",
  },
  {
    name: "High Bay Rack",
    description: "High-bay rack structure maximizing cubic density for pallets and oversized loads.",
    imageUrl: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606",
  },
  {
    name: "ARSR",
    description: "Automated Storage and Retrieval Systems,  grid orchestrating deep-lane buffering for fast movers.",
    imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429",
  },
  {
    name: "CRM",
    description: "Conveyor on Rail Motorized. Powered conveyor-on-rail network routing totes across mezzanines and paint shops.",
    imageUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e",
  },
];

const usersSeedData = [
  {
    email: "valery@opmobility.com",
    name: "Valery",
    password: "ChangeMe123",
    birthDate: new Date("1990-05-10"),
  },
  {
    email: "ops@opmobility.com",
    name: "Ops Team",
    password: "ChangeMe123",
    birthDate: new Date("1988-09-15"),
  },
];

const storageMeansSeedData = [
  {
    name: "Cold room A1",
    description: "Primary refrigerated storage zone",
    status: "ACTIVE",
    ownerEmail: "valery@example.com",
  },
  {
    name: "Dry warehouse B4",
    description: "Ambient storage for packaging",
    status: "ACTIVE",
    ownerEmail: "ops@example.com",
  },
  {
    name: "Overflow zone C2",
    description: "Temporary holding area",
    status: "DRAFT",
    ownerEmail: "ops@example.com",
  },
] as const;

const plantSeedData = [
  { name: "Detroit Assembly", address: { street: "1200 Industrial Dr", city: "Detroit", zipcode: "48201", countryCode: "US" } },
  { name: "Montreal Plastics", address: { street: "45 Rue Industrielle", city: "Montreal", zipcode: "H1A 0A1", countryCode: "CA" } },
  { name: "Queretaro Trim", address: { street: "220 Parque Tech", city: "Queretaro", zipcode: "76100", countryCode: "MX" } },
  { name: "Sao Paulo Molding", address: { street: "88 Rua do Pólo", city: "Sao Paulo", zipcode: "01000-000", countryCode: "BR" } },
  { name: "Lyon Composites", address: { street: "15 Rue des Usines", city: "Lyon", zipcode: "69002", countryCode: "FR" } },
  { name: "Stuttgart Paint", address: { street: "12 Werkstrasse", city: "Stuttgart", zipcode: "70173", countryCode: "DE" } },
  { name: "Barcelona Assembly", address: { street: "34 Carrer Industrial", city: "Barcelona", zipcode: "08001", countryCode: "ES" } },
  { name: "Manchester Modules", address: { street: "5 Supply Park Way", city: "Manchester", zipcode: "M1 1AE", countryCode: "GB" } },
  { name: "Stockholm Lines", address: { street: "9 Logistikgatan", city: "Stockholm", zipcode: "111 20", countryCode: "SE" } },
  { name: "Johannesburg Components", address: { street: "18 Axis Road", city: "Johannesburg", zipcode: "2000", countryCode: "ZA" } },
  { name: "Casablanca Interiors", address: { street: "7 Zone Industrielle", city: "Casablanca", zipcode: "20050", countryCode: "MA" } },
  { name: "Bangalore Systems", address: { street: "210 Tech Park Rd", city: "Bangalore", zipcode: "560001", countryCode: "IN" } },
  { name: "Shanghai Stamping", address: { street: "66 Pudong Ave", city: "Shanghai", zipcode: "200120", countryCode: "CN" } },
  { name: "Nagoya Plastics", address: { street: "3 Chome Nishiki", city: "Nagoya", zipcode: "460-0003", countryCode: "JP" } },
  { name: "Sydney Kitting", address: { street: "14 Logistics Blvd", city: "Sydney", zipcode: "2000", countryCode: "AU" } },
] as const;

const supplierSeedData = [
  { name: "North Steel", address: { street: "310 Foundry Rd", city: "Detroit", zipcode: "48202", countryCode: "US" } },
  { name: "Maple Resin", address: { street: "72 Chemin Nord", city: "Montreal", zipcode: "H1B 1B1", countryCode: "CA" } },
  { name: "Aztec Fasteners", address: { street: "501 Ruta 57", city: "Queretaro", zipcode: "76116", countryCode: "MX" } },
  { name: "Paulista Coatings", address: { street: "12 Avenida Azul", city: "Sao Paulo", zipcode: "01010-010", countryCode: "BR" } },
  { name: "Rhone Textiles", address: { street: "21 Quai Sud", city: "Lyon", zipcode: "69003", countryCode: "FR" } },
  { name: "Neckar Plast", address: { street: "4 Farbstrasse", city: "Stuttgart", zipcode: "70176", countryCode: "DE" } },
  { name: "Catalunya Metals", address: { street: "56 Carrer del Port", city: "Barcelona", zipcode: "08019", countryCode: "ES" } },
  { name: "Pennine Glass", address: { street: "8 Canal Street", city: "Manchester", zipcode: "M2 3GX", countryCode: "GB" } },
  { name: "Nordic Foams", address: { street: "11 Fabriksvägen", city: "Stockholm", zipcode: "112 21", countryCode: "SE" } },
  { name: "Gauteng Rubber", address: { street: "19 Supply Rd", city: "Johannesburg", zipcode: "2001", countryCode: "ZA" } },
  { name: "Atlas Metals", address: { street: "5 Port Logistique", city: "Casablanca", zipcode: "20060", countryCode: "MA" } },
  { name: "Coromandel Chemicals", address: { street: "14 Bannerghatta Rd", city: "Bangalore", zipcode: "560029", countryCode: "IN" } },
  { name: "Pudong Fasteners", address: { street: "88 Zhangyang Rd", city: "Shanghai", zipcode: "200135", countryCode: "CN" } },
  { name: "Chubu Springs", address: { street: "2-10 Sakae", city: "Nagoya", zipcode: "460-0008", countryCode: "JP" } },
  { name: "Harbour Composites", address: { street: "41 Botany Rd", city: "Sydney", zipcode: "2015", countryCode: "AU" } },
  { name: "Midwest Machining", address: { street: "220 Industrial Ave", city: "Detroit", zipcode: "48205", countryCode: "US" } },
  { name: "Ligurian Plastics", address: { street: "17 Via Mare", city: "Lyon", zipcode: "69007", countryCode: "FR" } },
  { name: "Andes Fibers", address: { street: "77 Rua Verde", city: "Sao Paulo", zipcode: "01015-030", countryCode: "BR" } },
  { name: "Baltic Fasteners", address: { street: "23 Skeppsgatan", city: "Stockholm", zipcode: "116 30", countryCode: "SE" } },
  { name: "Danube Castings", address: { street: "9 Hafenstrasse", city: "Stuttgart", zipcode: "70180", countryCode: "DE" } },
] as const;

const projectSeedData = [
  { name: "Aurora Sedan Program", code: "AUR01", sop: new Date("2026-03-01"), eop: new Date("2032-12-31") },
  { name: "Beacon SUV Refresh", code: "BEC11", sop: new Date("2026-07-01"), eop: new Date("2031-06-30") },
  { name: "Comet EV Launch", code: "COM21", sop: new Date("2027-01-15"), eop: new Date("2033-12-31") },
  { name: "Draco Crossover", code: "DRA31", sop: new Date("2026-10-01"), eop: new Date("2032-03-31") },
  { name: "Equinox Van", code: "EQX41", sop: new Date("2027-04-01"), eop: new Date("2034-04-30") },
  { name: "Falcon Pickup", code: "FAL51", sop: new Date("2026-09-01"), eop: new Date("2031-12-31") },
  { name: "Glacier Bus", code: "GLA61", sop: new Date("2027-02-01"), eop: new Date("2033-06-30") },
  { name: "Helios Coupe", code: "HEL71", sop: new Date("2026-05-15"), eop: new Date("2032-05-31") },
  { name: "Ion Compact", code: "ION81", sop: new Date("2026-11-01"), eop: new Date("2032-09-30") },
  { name: "Jade Luxury", code: "JAD91", sop: new Date("2027-06-01"), eop: new Date("2033-08-31") },
  { name: "Kestrel Fleet", code: "KES02", sop: new Date("2026-08-01"), eop: new Date("2031-10-31") },
  { name: "Lumen Utility", code: "LUM12", sop: new Date("2027-03-01"), eop: new Date("2032-12-31") },
  { name: "Mirage Roadster", code: "MIR22", sop: new Date("2026-12-01"), eop: new Date("2032-11-30") },
  { name: "Nova EV", code: "NOV32", sop: new Date("2027-05-01"), eop: new Date("2034-01-31") },
  { name: "Orion Shuttle", code: "ORI42", sop: new Date("2026-04-01"), eop: new Date("2031-12-31") },
  { name: "Pioneer Wagon", code: "PIO52", sop: new Date("2026-09-15"), eop: new Date("2032-07-31") },
  { name: "Quasar Van", code: "QUA62", sop: new Date("2027-01-01"), eop: new Date("2033-09-30") },
  { name: "Radiant CUV", code: "RAD72", sop: new Date("2026-06-01"), eop: new Date("2032-02-28") },
  { name: "Stratus Sedan", code: "STR82", sop: new Date("2026-10-15"), eop: new Date("2032-12-31") },
  { name: "Titan Pickup", code: "TIT92", sop: new Date("2027-02-15"), eop: new Date("2033-10-31") },
] as const;

const countriesSeedData = [
  { name: "Afghanistan", code: "AF" },
  { name: "Albania", code: "AL" },
  { name: "Algeria", code: "DZ" },
  { name: "American Samoa", code: "AS" },
  { name: "Andorra", code: "AD" },
  { name: "Angola", code: "AO" },
  { name: "Anguilla", code: "AI" },
  { name: "Antarctica", code: "AQ" },
  { name: "Antigua and Barbuda", code: "AG" },
  { name: "Argentina", code: "AR" },
  { name: "Armenia", code: "AM" },
  { name: "Aruba", code: "AW" },
  { name: "Australia", code: "AU" },
  { name: "Austria", code: "AT" },
  { name: "Azerbaijan", code: "AZ" },
  { name: "Bahamas", code: "BS" },
  { name: "Bahrain", code: "BH" },
  { name: "Bangladesh", code: "BD" },
  { name: "Barbados", code: "BB" },
  { name: "Belarus", code: "BY" },
  { name: "Belgium", code: "BE" },
  { name: "Belize", code: "BZ" },
  { name: "Benin", code: "BJ" },
  { name: "Bermuda", code: "BM" },
  { name: "Bhutan", code: "BT" },
  { name: "Bolivia", code: "BO" },
  { name: "Bosnia and Herzegovina", code: "BA" },
  { name: "Botswana", code: "BW" },
  { name: "Bouvet Island", code: "BV" },
  { name: "Brazil", code: "BR" },
  { name: "British Indian Ocean Territory", code: "IO" },
  { name: "Brunei Darussalam", code: "BN" },
  { name: "Bulgaria", code: "BG" },
  { name: "Burkina Faso", code: "BF" },
  { name: "Burundi", code: "BI" },
  { name: "Cambodia", code: "KH" },
  { name: "Cameroon", code: "CM" },
  { name: "Canada", code: "CA" },
  { name: "Cape Verde", code: "CV" },
  { name: "Cayman Islands", code: "KY" },
  { name: "Central African Republic", code: "CF" },
  { name: "Chad", code: "TD" },
  { name: "Chile", code: "CL" },
  { name: "China", code: "CN" },
  { name: "Christmas Island", code: "CX" },
  { name: "Cocos (Keeling) Islands", code: "CC" },
  { name: "Colombia", code: "CO" },
  { name: "Comoros", code: "KM" },
  { name: "Congo", code: "CG" },
  { name: "Congo, the Democratic Republic of the", code: "CD" },
  { name: "Cook Islands", code: "CK" },
  { name: "Costa Rica", code: "CR" },
  { name: "Cote d'Ivoire", code: "CI" },
  { name: "Croatia", code: "HR" },
  { name: "Cuba", code: "CU" },
  { name: "Cyprus", code: "CY" },
  { name: "Czech Republic", code: "CZ" },
  { name: "Denmark", code: "DK" },
  { name: "Djibouti", code: "DJ" },
  { name: "Dominica", code: "DM" },
  { name: "Dominican Republic", code: "DO" },
  { name: "Ecuador", code: "EC" },
  { name: "Egypt", code: "EG" },
  { name: "El Salvador", code: "SV" },
  { name: "Equatorial Guinea", code: "GQ" },
  { name: "Eritrea", code: "ER" },
  { name: "Estonia", code: "EE" },
  { name: "Ethiopia", code: "ET" },
  { name: "Falkland Islands (Malvinas)", code: "FK" },
  { name: "Faroe Islands", code: "FO" },
  { name: "Fiji", code: "FJ" },
  { name: "Finland", code: "FI" },
  { name: "France", code: "FR" },
  { name: "French Guiana", code: "GF" },
  { name: "French Polynesia", code: "PF" },
  { name: "French Southern Territories", code: "TF" },
  { name: "Gabon", code: "GA" },
  { name: "Gambia", code: "GM" },
  { name: "Georgia", code: "GE" },
  { name: "Germany", code: "DE" },
  { name: "Ghana", code: "GH" },
  { name: "Gibraltar", code: "GI" },
  { name: "Greece", code: "GR" },
  { name: "Greenland", code: "GL" },
  { name: "Grenada", code: "GD" },
  { name: "Guadeloupe", code: "GP" },
  { name: "Guam", code: "GU" },
  { name: "Guatemala", code: "GT" },
  { name: "Guernsey", code: "GG" },
  { name: "Guinea", code: "GN" },
  { name: "Guinea-Bissau", code: "GW" },
  { name: "Guyana", code: "GY" },
  { name: "Haiti", code: "HT" },
  { name: "Heard Island and McDonald Islands", code: "HM" },
  { name: "Holy See (Vatican City State)", code: "VA" },
  { name: "Honduras", code: "HN" },
  { name: "Hong Kong", code: "HK" },
  { name: "Hungary", code: "HU" },
  { name: "Iceland", code: "IS" },
  { name: "India", code: "IN" },
  { name: "Indonesia", code: "ID" },
  { name: "Iran, Islamic Republic of", code: "IR" },
  { name: "Iraq", code: "IQ" },
  { name: "Ireland", code: "IE" },
  { name: "Isle of Man", code: "IM" },
  { name: "Israel", code: "IL" },
  { name: "Italy", code: "IT" },
  { name: "Jamaica", code: "JM" },
  { name: "Japan", code: "JP" },
  { name: "Jersey", code: "JE" },
  { name: "Jordan", code: "JO" },
  { name: "Kazakhstan", code: "KZ" },
  { name: "Kenya", code: "KE" },
  { name: "Kiribati", code: "KI" },
  { name: "Korea, Democratic People's Republic of", code: "KP" },
  { name: "Korea, Republic of", code: "KR" },
  { name: "Kuwait", code: "KW" },
  { name: "Kyrgyzstan", code: "KG" },
  { name: "Lao People's Democratic Republic", code: "LA" },
  { name: "Latvia", code: "LV" },
  { name: "Lebanon", code: "LB" },
  { name: "Lesotho", code: "LS" },
  { name: "Liberia", code: "LR" },
  { name: "Libyan Arab Jamahiriya", code: "LY" },
  { name: "Liechtenstein", code: "LI" },
  { name: "Lithuania", code: "LT" },
  { name: "Luxembourg", code: "LU" },
  { name: "Macao", code: "MO" },
  { name: "North Macedonia", code: "MK" },
  { name: "Madagascar", code: "MG" },
  { name: "Malawi", code: "MW" },
  { name: "Malaysia", code: "MY" },
  { name: "Maldives", code: "MV" },
  { name: "Mali", code: "ML" },
  { name: "Malta", code: "MT" },
  { name: "Marshall Islands", code: "MH" },
  { name: "Martinique", code: "MQ" },
  { name: "Mauritania", code: "MR" },
  { name: "Mauritius", code: "MU" },
  { name: "Mayotte", code: "YT" },
  { name: "Mexico", code: "MX" },
  { name: "Micronesia, Federated States of", code: "FM" },
  { name: "Moldova, Republic of", code: "MD" },
  { name: "Monaco", code: "MC" },
  { name: "Mongolia", code: "MN" },
  { name: "Montenegro", code: "ME" },
  { name: "Montserrat", code: "MS" },
  { name: "Morocco", code: "MA" },
  { name: "Mozambique", code: "MZ" },
  { name: "Myanmar", code: "MM" },
  { name: "Namibia", code: "NA" },
  { name: "Nauru", code: "NR" },
  { name: "Nepal", code: "NP" },
  { name: "Netherlands", code: "NL" },
  { name: "New Caledonia", code: "NC" },
  { name: "New Zealand", code: "NZ" },
  { name: "Nicaragua", code: "NI" },
  { name: "Niger", code: "NE" },
  { name: "Nigeria", code: "NG" },
  { name: "Niue", code: "NU" },
  { name: "Norfolk Island", code: "NF" },
  { name: "Northern Mariana Islands", code: "MP" },
  { name: "Norway", code: "NO" },
  { name: "Oman", code: "OM" },
  { name: "Pakistan", code: "PK" },
  { name: "Palau", code: "PW" },
  { name: "Palestinian Territory, Occupied", code: "PS" },
  { name: "Panama", code: "PA" },
  { name: "Papua New Guinea", code: "PG" },
  { name: "Paraguay", code: "PY" },
  { name: "Peru", code: "PE" },
  { name: "Philippines", code: "PH" },
  { name: "Pitcairn", code: "PN" },
  { name: "Poland", code: "PL" },
  { name: "Portugal", code: "PT" },
  { name: "Puerto Rico", code: "PR" },
  { name: "Qatar", code: "QA" },
  { name: "Reunion", code: "RE" },
  { name: "Romania", code: "RO" },
  { name: "Russian Federation", code: "RU" },
  { name: "Rwanda", code: "RW" },
  { name: "Saint Helena", code: "SH" },
  { name: "Saint Kitts and Nevis", code: "KN" },
  { name: "Saint Lucia", code: "LC" },
  { name: "Saint Pierre and Miquelon", code: "PM" },
  { name: "Saint Vincent and the Grenadines", code: "VC" },
  { name: "Samoa", code: "WS" },
  { name: "San Marino", code: "SM" },
  { name: "Sao Tome and Principe", code: "ST" },
  { name: "Saudi Arabia", code: "SA" },
  { name: "Senegal", code: "SN" },
  { name: "Serbia", code: "RS" },
  { name: "Seychelles", code: "SC" },
  { name: "Sierra Leone", code: "SL" },
  { name: "Singapore", code: "SG" },
  { name: "Slovakia", code: "SK" },
  { name: "Slovenia", code: "SI" },
  { name: "Solomon Islands", code: "SB" },
  { name: "Somalia", code: "SO" },
  { name: "South Africa", code: "ZA" },
  { name: "South Georgia and the South Sandwich Islands", code: "GS" },
  { name: "South Sudan", code: "SS" },
  { name: "Spain", code: "ES" },
  { name: "Sri Lanka", code: "LK" },
  { name: "Sudan", code: "SD" },
  { name: "Suriname", code: "SR" },
  { name: "Svalbard and Jan Mayen", code: "SJ" },
  { name: "Swaziland", code: "SZ" },
  { name: "Sweden", code: "SE" },
  { name: "Switzerland", code: "CH" },
  { name: "Syrian Arab Republic", code: "SY" },
  { name: "Taiwan, Province of China", code: "TW" },
  { name: "Tajikistan", code: "TJ" },
  { name: "Tanzania, United Republic of", code: "TZ" },
  { name: "Thailand", code: "TH" },
  { name: "Timor-Leste", code: "TL" },
  { name: "Togo", code: "TG" },
  { name: "Tokelau", code: "TK" },
  { name: "Tonga", code: "TO" },
  { name: "Trinidad and Tobago", code: "TT" },
  { name: "Tunisia", code: "TN" },
  { name: "Turkey", code: "TR" },
  { name: "Turkmenistan", code: "TM" },
  { name: "Turks and Caicos Islands", code: "TC" },
  { name: "Tuvalu", code: "TV" },
  { name: "Uganda", code: "UG" },
  { name: "Ukraine", code: "UA" },
  { name: "United Arab Emirates", code: "AE" },
  { name: "United Kingdom", code: "GB" },
  { name: "United States", code: "US" },
  { name: "United States Minor Outlying Islands", code: "UM" },
  { name: "Uruguay", code: "UY" },
  { name: "Uzbekistan", code: "UZ" },
  { name: "Vanuatu", code: "VU" },
  { name: "Venezuela", code: "VE" },
  { name: "Viet Nam", code: "VN" },
  { name: "Virgin Islands, British", code: "VG" },
  { name: "Virgin Islands, U.S.", code: "VI" },
  { name: "Wallis and Futuna", code: "WF" },
  { name: "Western Sahara", code: "EH" },
  { name: "Yemen", code: "YE" },
  { name: "Zambia", code: "ZM" },
  { name: "Zimbabwe", code: "ZW" },
  { name: "Curacao", code: "CW" },
  { name: "Bonaire, Saint Eustatius and Saba", code: "BQ" },
  { name: "Sint Maarten (Dutch part)", code: "SX" },
  { name: "Kosovo", code: "XK" },
];

const buildSlug = (name: string, fallbackPrefix: string) => {
  const slug = slugifyValue(name);
  return slug.length ? slug : `${fallbackPrefix}-${randomUUID().slice(0, 8)}`;
};

async function getCountryMap(codes: Set<string>) {
  const countries = await prisma.country.findMany({
    where: { code: { in: Array.from(codes) } },
    select: { id: true, code: true },
  });
  const map = new Map(countries.map((country) => [country.code, country.id]));

  const missing = Array.from(codes).filter((code) => !map.has(code));
  if (missing.length) {
    throw new Error(`Missing countries for codes: ${missing.join(", ")}`);
  }

  return map;
}

async function seedPackagingMeanCategories() {
  const existingCount = await prisma.packagingMeanCategory.count();
  if (existingCount > 0) {
    console.info(`Skipping packaging mean category seed: ${existingCount} record(s) already present.`);
    return;
  }

  for (const category of packagingMeanCategoriesSeedData) {
    await prisma.packagingMeanCategory.create({
      data: {
        name: category.name,
        description: category.description,
        slug: buildSlug(category.name, "packaging"),
        image: {
          create: {
            imageUrl: category.imageUrl,
          },
        },
      },
    });
  }
  console.info(`Seeded ${packagingMeanCategoriesSeedData.length} packaging mean categories.`);
}

async function seedStorageMeanCategories() {
  const existingCount = await prisma.storageMeanCategory.count();
  if (existingCount > 0) {
    console.info(`Skipping storage mean category seed: ${existingCount} record(s) already present.`);
    return;
  }

  for (const category of storageMeanCategoriesSeedData) {
    await prisma.storageMeanCategory.create({
      data: {
        name: category.name,
        description: category.description,
        slug: buildSlug(category.name, "storage"),
        image: {
          create: {
            imageUrl: category.imageUrl,
          },
        },
      },
    });
  }
  console.info(`Seeded ${storageMeanCategoriesSeedData.length} storage mean categories.`);
}

async function seedUsersAndStorage() {
  const userMap = new Map<string, string>();

  for (const user of usersSeedData) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, passwordHash, birthDate: user.birthDate },
      create: {
        email: user.email,
        name: user.name,
        passwordHash,
        birthDate: user.birthDate,
      },
    });
    userMap.set(user.email, created.id);
  }

  for (const storage of storageMeansSeedData) {
    const ownerId = storage.ownerEmail ? userMap.get(storage.ownerEmail) ?? null : null;
    const status = storage.status as $Enums.StorageStatus;
    await prisma.storageMean.upsert({
      where: { name: storage.name },
      update: {
        description: storage.description,
        status,
        ownerId,
      },
      create: {
        name: storage.name,
        description: storage.description,
        status,
        ownerId,
      },
    });
  }
}

async function seedPlants() {
  const plantCount = await prisma.plant.count();
  if (plantCount > 0) {
    console.info(`Skipping plant seed: ${plantCount} record(s) already present.`);
    return;
  }

  const countryCodes = new Set(plantSeedData.map((plant) => plant.address.countryCode));
  const countryMap = await getCountryMap(countryCodes);

  for (const plant of plantSeedData) {
    const countryId = countryMap.get(plant.address.countryCode)!;
    await prisma.plant.create({
      data: {
        name: plant.name,
        address: {
          create: {
            street: plant.address.street,
            city: plant.address.city,
            zipcode: plant.address.zipcode,
            countryId,
          },
        },
      },
    });
  }

  console.info(`Seeded ${plantSeedData.length} plants with addresses.`);
}

async function seedSuppliers() {
  const supplierCount = await prisma.supplier.count();
  if (supplierCount > 0) {
    console.info(`Skipping supplier seed: ${supplierCount} record(s) already present.`);
    return;
  }

  const allowedCountries = new Set(plantSeedData.map((plant) => plant.address.countryCode));
  const supplierCodes = new Set(supplierSeedData.map((supplier) => supplier.address.countryCode));

  const invalidCodes = Array.from(supplierCodes).filter((code) => !allowedCountries.has(code));
  if (invalidCodes.length) {
    throw new Error(`Supplier country codes not in plant seeds: ${invalidCodes.join(", ")}`);
  }

  const countryMap = await getCountryMap(supplierCodes);

  for (const supplier of supplierSeedData) {
    const countryId = countryMap.get(supplier.address.countryCode)!;
    await prisma.supplier.create({
      data: {
        name: supplier.name,
        address: {
          create: {
            street: supplier.address.street,
            city: supplier.address.city,
            zipcode: supplier.address.zipcode,
            countryId,
          },
        },
      },
    });
  }

  console.info(`Seeded ${supplierSeedData.length} suppliers with addresses.`);
}

async function seedProjects() {
  const projectCount = await prisma.project.count();
  if (projectCount > 0) {
    console.info(`Skipping project seed: ${projectCount} record(s) already present.`);
    return;
  }

  await prisma.project.createMany({
    data: projectSeedData.map((project) => ({
      ...project,
      slug: buildSlug(project.name, "project"),
    })),
  });

  console.info(`Seeded ${projectSeedData.length} projects.`);
}

async function seedCountries() {
  const existingCount = await prisma.country.count();
  if (existingCount > 0) {
    console.info(`Skipping country seed: ${existingCount} record(s) already present.`);
    return;
  }

  await prisma.country.createMany({ data: countriesSeedData });
  console.info(`Seeded ${countriesSeedData.length} countries.`);
}

async function main() {
  await seedCountries();
  await seedUsersAndStorage();
  await seedPlants();
  await seedSuppliers();
  await seedProjects();
  await seedPackagingMeanCategories();
  await seedStorageMeanCategories();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
