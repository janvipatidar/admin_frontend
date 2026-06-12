// Indian states/UTs with major cities (expand as needed)
export const INDIA_STATES_CITIES = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Tirupati'],
  'Arunachal Pradesh': ['Itanagar', 'Tawang', 'Pasighat'],
  Assam: ['Guwahati', 'Dibrugarh', 'Silchar', 'Jorhat'],
  Bihar: ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur'],
  Chhattisgarh: ['Raipur', 'Bhilai', 'Bilaspur', 'Durg'],
  Goa: ['Panaji', 'Margao', 'Vasco da Gama'],
  Gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'],
  Haryana: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Hisar'],
  'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Manali', 'Solan'],
  Jharkhand: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro'],
  Karnataka: ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi', 'Belagavi'],
  Kerala: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain'],
  Maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane', 'Aurangabad'],
  Manipur: ['Imphal'],
  Meghalaya: ['Shillong'],
  Mizoram: ['Aizawl'],
  Nagaland: ['Kohima', 'Dimapur'],
  Odisha: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Puri'],
  Punjab: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Mohali', 'Patiala'],
  Rajasthan: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'],
  Sikkim: ['Gangtok'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'],
  Telangana: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar'],
  Tripura: ['Agartala'],
  'Uttar Pradesh': ['Lucknow', 'Noida', 'Ghaziabad', 'Kanpur', 'Varanasi', 'Agra'],
  Uttarakhand: ['Dehradun', 'Haridwar', 'Rishikesh', 'Haldwani'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Siliguri'],
  Delhi: ['New Delhi', 'South Delhi', 'North Delhi', 'East Delhi', 'West Delhi'],
  Chandigarh: ['Chandigarh'],
  'Jammu and Kashmir': ['Srinagar', 'Jammu'],
  Ladakh: ['Leh', 'Kargil'],
  Puducherry: ['Puducherry'],
  'Andaman and Nicobar Islands': ['Port Blair'],
  Lakshadweep: ['Kavaratti'],
  'Dadra and Nagar Haveli and Daman and Diu': ['Daman', 'Silvassa'],
};

export const INDIA_STATES = Object.keys(INDIA_STATES_CITIES).sort();

export const OTHER_CITY_OPTION = 'Other';

export const getCitiesForState = (state, includeOther = true) => {
  const cities = INDIA_STATES_CITIES[state]
    ? [...INDIA_STATES_CITIES[state]].sort()
    : [];
  if (includeOther && state) {
    return [...cities, OTHER_CITY_OPTION];
  }
  return cities;
};
