-- 0006_add_countries.sql
-- Countries fact table following the UN M.49 geoscheme.
-- `name` matches the ReliefWeb API country.name field exactly.
-- `archived = 1` means the name is deprecated/renamed; old sitreps may still
-- reference it, so we keep the row to preserve join integrity.
--
-- TODO: Add a scheduled job to refresh this table from the ReliefWeb /countries
-- endpoint so that new names, iso3 codes, or shortnames are picked up
-- automatically (see docs/to-do_list.md).

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS countries (
    name        TEXT    PRIMARY KEY,  -- ReliefWeb long name (matches sitreps.location)
    shortname   TEXT,                 -- ReliefWeb shortname (nullable when same as name)
    iso3        TEXT,                 -- ISO 3166-1 alpha-3 (nullable for territories)
    continent   TEXT    NOT NULL,     -- UN geoscheme continent
    subregion   TEXT    NOT NULL,     -- UN geoscheme subregion
    archived    INTEGER NOT NULL DEFAULT 0  -- 1 = name deprecated; row kept for FK integrity
);

CREATE INDEX IF NOT EXISTS idx_countries_iso3      ON countries(iso3);
CREATE INDEX IF NOT EXISTS idx_countries_continent ON countries(continent);
CREATE INDEX IF NOT EXISTS idx_countries_subregion ON countries(subregion);

-- Add subregion to sitreps (nullable; backfilled below)
ALTER TABLE sitreps ADD COLUMN subregion TEXT;
CREATE INDEX IF NOT EXISTS idx_sitreps_subregion ON sitreps(subregion);

-- ---------------------------------------------------------------------------
-- Seed data — Africa
-- ---------------------------------------------------------------------------

-- Africa / Northern Africa
INSERT OR IGNORE INTO countries VALUES ('Algeria',       'Algeria',    'DZA', 'Africa', 'Northern Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Egypt',         'Egypt',      'EGY', 'Africa', 'Northern Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Libya',         'Libya',      'LBY', 'Africa', 'Northern Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Morocco',       'Morocco',    'MAR', 'Africa', 'Northern Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Sudan',         'Sudan',      'SDN', 'Africa', 'Northern Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Tunisia',       'Tunisia',    'TUN', 'Africa', 'Northern Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Western Sahara','Western Sahara','ESH','Africa','Northern Africa', 0);

-- Africa / Eastern Africa
INSERT OR IGNORE INTO countries VALUES ('Burundi',                      'Burundi',   'BDI', 'Africa', 'Eastern Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Comoros',                      'Comoros',   'COM', 'Africa', 'Eastern Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Djibouti',                     'Djibouti',  'DJI', 'Africa', 'Eastern Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Eritrea',                      'Eritrea',   'ERI', 'Africa', 'Eastern Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Ethiopia',                     'Ethiopia',  'ETH', 'Africa', 'Eastern Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Kenya',                        'Kenya',     'KEN', 'Africa', 'Eastern Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Madagascar',                   'Madagascar','MDG', 'Africa', 'Eastern Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Malawi',                       'Malawi',    'MWI', 'Africa', 'Eastern Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Mauritius',                    'Mauritius', 'MUS', 'Africa', 'Eastern Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Mozambique',                   'Mozambique','MOZ', 'Africa', 'Eastern Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Rwanda',                       'Rwanda',    'RWA', 'Africa', 'Eastern Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Seychelles',                   'Seychelles','SYC', 'Africa', 'Eastern Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Somalia',                      'Somalia',   'SOM', 'Africa', 'Eastern Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('South Sudan',                  'South Sudan','SSD','Africa', 'Eastern Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Uganda',                       'Uganda',    'UGA', 'Africa', 'Eastern Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('United Republic of Tanzania',  'Tanzania',  'TZA', 'Africa', 'Eastern Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Zambia',                       'Zambia',    'ZMB', 'Africa', 'Eastern Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Zimbabwe',                     'Zimbabwe',  'ZWE', 'Africa', 'Eastern Africa', 0);

-- Africa / Middle Africa
INSERT OR IGNORE INTO countries VALUES ('Angola',                       'Angola',    'AGO', 'Africa', 'Middle Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Cameroon',                     'Cameroon',  'CMR', 'Africa', 'Middle Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Central African Republic',     'CAR',       'CAF', 'Africa', 'Middle Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Chad',                         'Chad',      'TCD', 'Africa', 'Middle Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Congo',                        'Congo',     'COG', 'Africa', 'Middle Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Democratic Republic of the Congo','DR Congo','COD','Africa', 'Middle Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Equatorial Guinea',            'Eq. Guinea','GNQ', 'Africa', 'Middle Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Gabon',                        'Gabon',     'GAB', 'Africa', 'Middle Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Sao Tome and Principe',        NULL,        'STP', 'Africa', 'Middle Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('São Tomé and Príncipe',        NULL,        'STP', 'Africa', 'Middle Africa', 0);

-- Africa / Southern Africa
INSERT OR IGNORE INTO countries VALUES ('Botswana',   'Botswana',    'BWA', 'Africa', 'Southern Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Eswatini',   'Eswatini',    'SWZ', 'Africa', 'Southern Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Lesotho',    'Lesotho',     'LSO', 'Africa', 'Southern Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Namibia',    'Namibia',     'NAM', 'Africa', 'Southern Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('South Africa','South Africa','ZAF', 'Africa', 'Southern Africa', 0);
-- Archived: Swaziland renamed to Eswatini in 2018; old sitreps may reference it
INSERT OR IGNORE INTO countries VALUES ('Swaziland',  'Swaziland',   'SWZ', 'Africa', 'Southern Africa', 1);

-- Africa / Western Africa
INSERT OR IGNORE INTO countries VALUES ('Benin',          'Benin',         'BEN', 'Africa', 'Western Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Burkina Faso',   'Burkina Faso',  'BFA', 'Africa', 'Western Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Cabo Verde',     'Cabo Verde',    'CPV', 'Africa', 'Western Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Cape Verde',     'Cabo Verde',    'CPV', 'Africa', 'Western Africa', 1);
INSERT OR IGNORE INTO countries VALUES ('Côte d''Ivoire', 'Côte d''Ivoire','CIV', 'Africa', 'Western Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Gambia',         'Gambia',        'GMB', 'Africa', 'Western Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Ghana',          'Ghana',         'GHA', 'Africa', 'Western Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Guinea',         'Guinea',        'GIN', 'Africa', 'Western Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Guinea-Bissau',  'Guinea-Bissau', 'GNB', 'Africa', 'Western Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Liberia',        'Liberia',       'LBR', 'Africa', 'Western Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Mali',           'Mali',          'MLI', 'Africa', 'Western Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Mauritania',     'Mauritania',    'MRT', 'Africa', 'Western Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Niger',          'Niger',         'NER', 'Africa', 'Western Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Nigeria',        'Nigeria',       'NGA', 'Africa', 'Western Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Senegal',        'Senegal',       'SEN', 'Africa', 'Western Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Sierra Leone',   'Sierra Leone',  'SLE', 'Africa', 'Western Africa', 0);
INSERT OR IGNORE INTO countries VALUES ('Togo',           'Togo',          'TGO', 'Africa', 'Western Africa', 0);

-- ---------------------------------------------------------------------------
-- Seed data — Americas
-- ---------------------------------------------------------------------------

-- Americas / Caribbean
INSERT OR IGNORE INTO countries VALUES ('Antigua and Barbuda',              NULL,          'ATG', 'Americas', 'Caribbean', 0);
INSERT OR IGNORE INTO countries VALUES ('Bahamas',                          'Bahamas',     'BHS', 'Americas', 'Caribbean', 0);
INSERT OR IGNORE INTO countries VALUES ('Barbados',                         'Barbados',    'BRB', 'Americas', 'Caribbean', 0);
INSERT OR IGNORE INTO countries VALUES ('Cuba',                             'Cuba',        'CUB', 'Americas', 'Caribbean', 0);
INSERT OR IGNORE INTO countries VALUES ('Dominica',                         'Dominica',    'DMA', 'Americas', 'Caribbean', 0);
INSERT OR IGNORE INTO countries VALUES ('Dominican Republic',               'Dom. Rep.',   'DOM', 'Americas', 'Caribbean', 0);
INSERT OR IGNORE INTO countries VALUES ('Grenada',                          'Grenada',     'GRD', 'Americas', 'Caribbean', 0);
INSERT OR IGNORE INTO countries VALUES ('Haiti',                            'Haiti',       'HTI', 'Americas', 'Caribbean', 0);
INSERT OR IGNORE INTO countries VALUES ('Jamaica',                          'Jamaica',     'JAM', 'Americas', 'Caribbean', 0);
INSERT OR IGNORE INTO countries VALUES ('Saint Kitts and Nevis',            NULL,          'KNA', 'Americas', 'Caribbean', 0);
INSERT OR IGNORE INTO countries VALUES ('Saint Lucia',                      NULL,          'LCA', 'Americas', 'Caribbean', 0);
INSERT OR IGNORE INTO countries VALUES ('Saint Vincent and the Grenadines', NULL,          'VCT', 'Americas', 'Caribbean', 0);
INSERT OR IGNORE INTO countries VALUES ('Trinidad and Tobago',              NULL,          'TTO', 'Americas', 'Caribbean', 0);

-- Americas / Central America
INSERT OR IGNORE INTO countries VALUES ('Belize',     'Belize',     'BLZ', 'Americas', 'Central America', 0);
INSERT OR IGNORE INTO countries VALUES ('Costa Rica', 'Costa Rica', 'CRI', 'Americas', 'Central America', 0);
INSERT OR IGNORE INTO countries VALUES ('El Salvador','El Salvador','SLV', 'Americas', 'Central America', 0);
INSERT OR IGNORE INTO countries VALUES ('Guatemala',  'Guatemala',  'GTM', 'Americas', 'Central America', 0);
INSERT OR IGNORE INTO countries VALUES ('Honduras',   'Honduras',   'HND', 'Americas', 'Central America', 0);
INSERT OR IGNORE INTO countries VALUES ('Mexico',     'Mexico',     'MEX', 'Americas', 'Central America', 0);
INSERT OR IGNORE INTO countries VALUES ('Nicaragua',  'Nicaragua',  'NIC', 'Americas', 'Central America', 0);
INSERT OR IGNORE INTO countries VALUES ('Panama',     'Panama',     'PAN', 'Americas', 'Central America', 0);

-- Americas / Northern America
INSERT OR IGNORE INTO countries VALUES ('Canada',                 'Canada', 'CAN', 'Americas', 'Northern America', 0);
INSERT OR IGNORE INTO countries VALUES ('United States of America','USA',   'USA', 'Americas', 'Northern America', 0);

-- Americas / South America
INSERT OR IGNORE INTO countries VALUES ('Argentina',                         'Argentina', 'ARG', 'Americas', 'South America', 0);
INSERT OR IGNORE INTO countries VALUES ('Bolivia',                           'Bolivia',   'BOL', 'Americas', 'South America', 0);
INSERT OR IGNORE INTO countries VALUES ('Bolivia (Plurinational State of)',  'Bolivia',   'BOL', 'Americas', 'South America', 0);
INSERT OR IGNORE INTO countries VALUES ('Brazil',                            'Brazil',    'BRA', 'Americas', 'South America', 0);
INSERT OR IGNORE INTO countries VALUES ('Chile',                             'Chile',     'CHL', 'Americas', 'South America', 0);
INSERT OR IGNORE INTO countries VALUES ('Colombia',                          'Colombia',  'COL', 'Americas', 'South America', 0);
INSERT OR IGNORE INTO countries VALUES ('Ecuador',                           'Ecuador',   'ECU', 'Americas', 'South America', 0);
INSERT OR IGNORE INTO countries VALUES ('Guyana',                            'Guyana',    'GUY', 'Americas', 'South America', 0);
INSERT OR IGNORE INTO countries VALUES ('Paraguay',                          'Paraguay',  'PRY', 'Americas', 'South America', 0);
INSERT OR IGNORE INTO countries VALUES ('Peru',                              'Peru',      'PER', 'Americas', 'South America', 0);
INSERT OR IGNORE INTO countries VALUES ('Suriname',                          'Suriname',  'SUR', 'Americas', 'South America', 0);
INSERT OR IGNORE INTO countries VALUES ('Uruguay',                           'Uruguay',   'URY', 'Americas', 'South America', 0);
INSERT OR IGNORE INTO countries VALUES ('Venezuela',                         'Venezuela', 'VEN', 'Americas', 'South America', 0);
INSERT OR IGNORE INTO countries VALUES ('Venezuela (Bolivarian Republic of)','Venezuela', 'VEN', 'Americas', 'South America', 0);

-- ---------------------------------------------------------------------------
-- Seed data — Asia
-- ---------------------------------------------------------------------------

-- Asia / Central Asia
INSERT OR IGNORE INTO countries VALUES ('Kazakhstan',  'Kazakhstan',  'KAZ', 'Asia', 'Central Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Kyrgyzstan',  'Kyrgyzstan',  'KGZ', 'Asia', 'Central Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Tajikistan',  'Tajikistan',  'TJK', 'Asia', 'Central Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Turkmenistan','Turkmenistan','TKM', 'Asia', 'Central Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Uzbekistan',  'Uzbekistan',  'UZB', 'Asia', 'Central Asia', 0);

-- Asia / Eastern Asia
INSERT OR IGNORE INTO countries VALUES ('China',    'China',    'CHN', 'Asia', 'Eastern Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Japan',    'Japan',    'JPN', 'Asia', 'Eastern Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Mongolia', 'Mongolia', 'MNG', 'Asia', 'Eastern Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Korea (the Democratic People''s Republic of)', 'Dem. Rep. Korea', 'PRK', 'Asia', 'Eastern Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Republic of Korea', 'Korea', 'KOR', 'Asia', 'Eastern Asia', 0);

-- Asia / South-eastern Asia
INSERT OR IGNORE INTO countries VALUES ('Brunei Darussalam',                       'Brunei',     'BRN', 'Asia', 'South-eastern Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Cambodia',                                'Cambodia',   'KHM', 'Asia', 'South-eastern Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Indonesia',                               'Indonesia',  'IDN', 'Asia', 'South-eastern Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Lao People''s Democratic Republic (the)', 'Lao PDR',   'LAO', 'Asia', 'South-eastern Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Malaysia',                                'Malaysia',   'MYS', 'Asia', 'South-eastern Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Myanmar',                                 'Myanmar',    'MMR', 'Asia', 'South-eastern Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Philippines',                             'Philippines','PHL', 'Asia', 'South-eastern Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Singapore',                               'Singapore',  'SGP', 'Asia', 'South-eastern Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Thailand',                                'Thailand',   'THA', 'Asia', 'South-eastern Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Timor-Leste',                             'Timor-Leste','TLS', 'Asia', 'South-eastern Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Viet Nam',                                'Viet Nam',   'VNM', 'Asia', 'South-eastern Asia', 0);

-- Asia / Southern Asia
INSERT OR IGNORE INTO countries VALUES ('Afghanistan',               'Afghanistan', 'AFG', 'Asia', 'Southern Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Bangladesh',                'Bangladesh',  'BGD', 'Asia', 'Southern Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Bhutan',                    'Bhutan',      'BTN', 'Asia', 'Southern Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('India',                     'India',       'IND', 'Asia', 'Southern Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Iran (Islamic Republic of)','Iran',        'IRN', 'Asia', 'Southern Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Maldives',                  'Maldives',    'MDV', 'Asia', 'Southern Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Nepal',                     'Nepal',       'NPL', 'Asia', 'Southern Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Pakistan',                  'Pakistan',    'PAK', 'Asia', 'Southern Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Sri Lanka',                 'Sri Lanka',   'LKA', 'Asia', 'Southern Asia', 0);

-- Asia / Western Asia
INSERT OR IGNORE INTO countries VALUES ('Armenia',              'Armenia',    'ARM', 'Asia', 'Western Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Azerbaijan',           'Azerbaijan', 'AZE', 'Asia', 'Western Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Bahrain',              'Bahrain',    'BHR', 'Asia', 'Western Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Cyprus',               'Cyprus',     'CYP', 'Asia', 'Western Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Georgia',              'Georgia',    'GEO', 'Asia', 'Western Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Iraq',                 'Iraq',       'IRQ', 'Asia', 'Western Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Israel',               'Israel',     'ISR', 'Asia', 'Western Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Jordan',               'Jordan',     'JOR', 'Asia', 'Western Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Kuwait',               'Kuwait',     'KWT', 'Asia', 'Western Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Lebanon',              'Lebanon',    'LBN', 'Asia', 'Western Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Oman',                 'Oman',       'OMN', 'Asia', 'Western Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Qatar',                'Qatar',      'QAT', 'Asia', 'Western Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Saudi Arabia',         'Saudi Arabia','SAU','Asia', 'Western Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Syrian Arab Republic', 'Syria',      'SYR', 'Asia', 'Western Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Turkey',               'Türkiye',    'TUR', 'Asia', 'Western Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Türkiye',              'Türkiye',    'TUR', 'Asia', 'Western Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('United Arab Emirates', 'UAE',        'ARE', 'Asia', 'Western Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('Yemen',                'Yemen',      'YEM', 'Asia', 'Western Asia', 0);
-- ReliefWeb uses lowercase 'o'; UN formally uses 'State of Palestine'
INSERT OR IGNORE INTO countries VALUES ('occupied Palestinian territory', 'oPt',       'PSE', 'Asia', 'Western Asia', 0);
INSERT OR IGNORE INTO countries VALUES ('State of Palestine',             'Palestine', 'PSE', 'Asia', 'Western Asia', 0);

-- ---------------------------------------------------------------------------
-- Seed data — Europe
-- ---------------------------------------------------------------------------

-- Europe / Eastern Europe
INSERT OR IGNORE INTO countries VALUES ('Belarus',            'Belarus',  'BLR', 'Europe', 'Eastern Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('Bulgaria',           'Bulgaria', 'BGR', 'Europe', 'Eastern Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('Czechia',            'Czechia',  'CZE', 'Europe', 'Eastern Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('Hungary',            'Hungary',  'HUN', 'Europe', 'Eastern Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('Poland',             'Poland',   'POL', 'Europe', 'Eastern Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('Republic of Moldova','Moldova',  'MDA', 'Europe', 'Eastern Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('Romania',            'Romania',  'ROU', 'Europe', 'Eastern Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('Russian Federation', 'Russia',   'RUS', 'Europe', 'Eastern Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('Slovakia',           'Slovakia', 'SVK', 'Europe', 'Eastern Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('Ukraine',            'Ukraine',  'UKR', 'Europe', 'Eastern Europe', 0);

-- Europe / Northern Europe
INSERT OR IGNORE INTO countries VALUES ('Denmark',   'Denmark',  'DNK', 'Europe', 'Northern Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('Estonia',   'Estonia',  'EST', 'Europe', 'Northern Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('Finland',   'Finland',  'FIN', 'Europe', 'Northern Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('Iceland',   'Iceland',  'ISL', 'Europe', 'Northern Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('Ireland',   'Ireland',  'IRL', 'Europe', 'Northern Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('Latvia',    'Latvia',   'LVA', 'Europe', 'Northern Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('Lithuania', 'Lithuania','LTU', 'Europe', 'Northern Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('Norway',    'Norway',   'NOR', 'Europe', 'Northern Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('Sweden',    'Sweden',   'SWE', 'Europe', 'Northern Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('United Kingdom of Great Britain and Northern Ireland', 'United Kingdom', 'GBR', 'Europe', 'Northern Europe', 0);

-- Europe / Southern Europe
INSERT OR IGNORE INTO countries VALUES ('Albania',               'Albania',     'ALB', 'Europe', 'Southern Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('Bosnia and Herzegovina','Bosnia',      'BIH', 'Europe', 'Southern Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('Croatia',               'Croatia',     'HRV', 'Europe', 'Southern Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('Greece',                'Greece',      'GRC', 'Europe', 'Southern Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('Italy',                 'Italy',       'ITA', 'Europe', 'Southern Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('Kosovo',                'Kosovo',      NULL,  'Europe', 'Southern Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('Malta',                 'Malta',       'MLT', 'Europe', 'Southern Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('Montenegro',            'Montenegro',  'MNE', 'Europe', 'Southern Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('North Macedonia',       'N. Macedonia','MKD', 'Europe', 'Southern Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('Portugal',              'Portugal',    'PRT', 'Europe', 'Southern Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('Serbia',                'Serbia',      'SRB', 'Europe', 'Southern Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('Slovenia',              'Slovenia',    'SVN', 'Europe', 'Southern Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('Spain',                 'Spain',       'ESP', 'Europe', 'Southern Europe', 0);

-- Europe / Western Europe
INSERT OR IGNORE INTO countries VALUES ('Austria',     'Austria',     'AUT', 'Europe', 'Western Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('Belgium',     'Belgium',     'BEL', 'Europe', 'Western Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('France',      'France',      'FRA', 'Europe', 'Western Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('Germany',     'Germany',     'DEU', 'Europe', 'Western Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('Luxembourg',  'Luxembourg',  'LUX', 'Europe', 'Western Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('Netherlands', 'Netherlands', 'NLD', 'Europe', 'Western Europe', 0);
INSERT OR IGNORE INTO countries VALUES ('Switzerland', 'Switzerland', 'CHE', 'Europe', 'Western Europe', 0);

-- ---------------------------------------------------------------------------
-- Seed data — Oceania
-- ---------------------------------------------------------------------------

-- Oceania / Australia and New Zealand
INSERT OR IGNORE INTO countries VALUES ('Australia',  'Australia',  'AUS', 'Oceania', 'Australia and New Zealand', 0);
INSERT OR IGNORE INTO countries VALUES ('New Zealand','New Zealand','NZL', 'Oceania', 'Australia and New Zealand', 0);

-- Oceania / Melanesia
INSERT OR IGNORE INTO countries VALUES ('Fiji',            'Fiji',        'FJI', 'Oceania', 'Melanesia', 0);
INSERT OR IGNORE INTO countries VALUES ('Papua New Guinea','PNG',         'PNG', 'Oceania', 'Melanesia', 0);
INSERT OR IGNORE INTO countries VALUES ('Solomon Islands', 'Solomon Is.', 'SLB', 'Oceania', 'Melanesia', 0);
INSERT OR IGNORE INTO countries VALUES ('Vanuatu',         'Vanuatu',     'VUT', 'Oceania', 'Melanesia', 0);

-- Oceania / Micronesia
INSERT OR IGNORE INTO countries VALUES ('Kiribati',                     'Kiribati',   'KIR', 'Oceania', 'Micronesia', 0);
INSERT OR IGNORE INTO countries VALUES ('Marshall Islands',             NULL,          'MHL', 'Oceania', 'Micronesia', 0);
INSERT OR IGNORE INTO countries VALUES ('Micronesia (Federated States of)', 'Micronesia','FSM','Oceania','Micronesia', 0);
INSERT OR IGNORE INTO countries VALUES ('Nauru',                        'Nauru',       'NRU', 'Oceania', 'Micronesia', 0);
INSERT OR IGNORE INTO countries VALUES ('Palau',                        'Palau',       'PLW', 'Oceania', 'Micronesia', 0);

-- Oceania / Polynesia
INSERT OR IGNORE INTO countries VALUES ('Samoa', 'Samoa', 'WSM', 'Oceania', 'Polynesia', 0);
INSERT OR IGNORE INTO countries VALUES ('Tonga', 'Tonga', 'TON', 'Oceania', 'Polynesia', 0);
INSERT OR IGNORE INTO countries VALUES ('Tuvalu','Tuvalu','TUV', 'Oceania', 'Polynesia', 0);

-- ---------------------------------------------------------------------------
-- Special entries
-- ---------------------------------------------------------------------------

-- World: used for global/multi-country sitreps; no UN subregion applicable
INSERT OR IGNORE INTO countries VALUES ('World', 'World', NULL, 'Global', 'Global', 0);

-- ---------------------------------------------------------------------------
-- Back-fill existing sitreps with subregion from the countries table
-- ---------------------------------------------------------------------------

UPDATE sitreps
SET subregion = (
    SELECT subregion FROM countries WHERE countries.name = sitreps.location
)
WHERE subregion IS NULL;

-- Also correct region values for any rows that used the old OCHA-convention
-- names (e.g. 'Asia and the Pacific', 'Middle East and North Africa') to the
-- UN geoscheme continent names used in the countries table.
UPDATE sitreps
SET region = (
    SELECT continent FROM countries WHERE countries.name = sitreps.location
)
WHERE location IN (SELECT name FROM countries);

INSERT OR IGNORE INTO schema_version(version) VALUES ('0006');

COMMIT;
