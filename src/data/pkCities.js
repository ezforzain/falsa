// Flat, alphabetical city list backing the searchable "Location" dropdown on the Corporate
// Verification form and the checkout address form. Derived from PK_CITIES_BY_PROVINCE (the
// fuller Province → City dataset used by the signup location picker) so both stay in sync
// instead of drifting as two separately hand-maintained lists.
import { PK_CITIES_BY_PROVINCE } from './pkLocations';

export const pkCities = Object.values(PK_CITIES_BY_PROVINCE)
  .flat()
  .sort((a, b) => a.localeCompare(b));
