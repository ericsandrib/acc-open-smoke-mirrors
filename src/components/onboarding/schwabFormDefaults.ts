// Prefilled sample per the Schwab Account Opening API example in the dev portal.
// Chris M. Lang — the sample Schwab gives you so the first "Send to Schwab"
// call can succeed against the sandbox without hand-typing 40 fields.

import type { SchwabCustomer } from '@/lib/schwabClient'

export const SCHWAB_SAMPLE_CUSTOMER: SchwabCustomer = {
  name: {
    firstName: 'Chris',
    middleName: 'M',
    lastName: 'Lang',
    suffix: 'Jr',
    alias: 'Mike',
  },
  dateOfBirth: '1988-05-13',
  ssn: '123456789',
  emailAddress: 'test@test.com',
  phoneNumbers: [
    {
      type: 'Home',
      countryCode: '1',
      areaCode: '718',
      prefix: '225',
      lineNumber: '2640',
      isInternational: true,
    },
  ],
  mailingAddressType: 'Home',
  addresses: [
    {
      addressType: 'Home',
      addressLine1: '10822 HARROGATE PLACE',
      addressLine2: 'Unit 412',
      addressLine3: 'West End',
      city: 'Aurora',
      state: 'CO',
      zipCode: '80018',
      country: 'US',
      isInternational: true,
    },
  ],
  employment: {
    status: 'Employed',
    occupation: 'BusinessOwnerOrSelfEmployed',
    occupationOther: 'Comedian',
    employerName: 'Charles Schwab',
    isEmployedBySecurityOrBrokerFirm: true,
    isDirector: true,
    directorDetails: [
      {
        companyName: 'International Business Machines Corporation',
        tradingSymbol: 'IBM',
      },
    ],
  },
  isCitizenOfAnotherCountry: true,
  isUsCitizen: true,
  isUsResident: true,
  identification: {
    identificationType: 'Passport',
    identificationNumber: 'K2348485',
    issuedDate: '2022-05-13',
    expiryDate: '2025-05-13',
    country: 'US',
    otherCountry: 'AL',
    countryOfBirth: 'US',
    passportIssuedCountry: 'US',
    driversLicenseIssuedState: 'CO',
    governmentIdIssuedState: 'CO',
  },
}

// Schwab API enumerations (derived from the createCustomer spec)
export const EMPLOYMENT_STATUS = [
  'Employed',
  'SelfEmployed',
  'Unemployed',
  'Retired',
  'Student',
  'Homemaker',
] as const

export const OCCUPATION = [
  'BusinessOwnerOrSelfEmployed',
  'Executive',
  'Professional',
  'Clerical',
  'Service',
  'Skilled',
  'Sales',
  'Farmer',
  'Military',
  'Other',
] as const

export const IDENTIFICATION_TYPE = [
  'Passport',
  'DriversLicense',
  'GovernmentId',
  'StateId',
  'MilitaryId',
] as const

export const PHONE_TYPE = ['Home', 'Work', 'Mobile'] as const

export const ADDRESS_TYPE = ['Home', 'Work', 'Mailing', 'Legal'] as const

export const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS',
  'KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY',
  'NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV',
  'WI','WY','DC',
] as const
