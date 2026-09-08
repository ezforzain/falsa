// Pakistan administrative hierarchy backing the signup "location" picker (Province → City).
// City lists are a representative set of the major cities/districts/tehsils in each
// province/region — not an exhaustive village-level gazetteer (Pakistan has 100,000+ villages,
// which isn't something that can be hand-maintained here). Specific villages/localities are
// captured as free text against the selected city instead — see the "Village / Area" field
// wherever this is used.
export const PK_PROVINCES = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Islamabad Capital Territory',
  'Azad Jammu & Kashmir',
  'Gilgit-Baltistan',
];

export const PK_CITIES_BY_PROVINCE = {
  Punjab: [
    'Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Gujranwala', 'Sialkot', 'Bahawalpur',
    'Sargodha', 'Sheikhupura', 'Jhang', 'Rahim Yar Khan', 'Gujrat', 'Kasur', 'Okara', 'Sahiwal',
    'Wah Cantonment', 'Dera Ghazi Khan', 'Chiniot', 'Kamoke', 'Mandi Bahauddin', 'Jhelum',
    'Sadiqabad', 'Khanewal', 'Hafizabad', 'Muzaffargarh', 'Vehari', 'Bahawalnagar', 'Kot Addu',
    'Khanpur', 'Jaranwala', 'Chishtian', 'Daska', 'Mianwali', 'Layyah', 'Toba Tek Singh',
    'Burewala', 'Pakpattan', 'Attock', 'Muridke', 'Kot Radha Kishan', 'Bhalwal',
    'Nankana Sahib', 'Arifwala', 'Ferozewala', 'Chakwal', 'Wazirabad', 'Kamalia', 'Kabirwala',
    'Depalpur', 'Hasilpur', 'Ahmedpur East', 'Lodhran', 'Pattoki', 'Shakargarh', 'Gojra',
    'Haroonabad', 'Narowal', 'Dunyapur', 'Talagang', 'Taunsa', 'Bhakkar', 'Yazman', 'Faqirwali',
    'Alipur',
  ],
  Sindh: [
    'Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Shaheed Benazirabad (Nawabshah)',
    'Mirpur Khas', 'Jacobabad', 'Shikarpur', 'Khairpur', 'Dadu', 'Thatta', 'Badin',
    'Tando Adam', 'Tando Allahyar', 'Umerkot', 'Ghotki', 'Kashmore', 'Kandhkot', 'Matiari',
    'Naushahro Feroze', 'Sanghar', 'Shahdadkot', 'Ranipur', 'Kotri', 'Hala', 'Moro', 'Kambar',
    'Sujawal', 'Tando Muhammad Khan', 'Mehar', 'Ratodero', 'Warah', 'Jamshoro', 'Pano Aqil',
    'Mithi (Tharparkar)', 'Dokri', 'Rohri', 'Faiz Ganj',
  ],
  'Khyber Pakhtunkhwa': [
    'Peshawar', 'Mardan', 'Mingora (Swat)', 'Kohat', 'Abbottabad', 'Bannu',
    'Dera Ismail Khan', 'Charsadda', 'Nowshera', 'Swabi', 'Mansehra', 'Haripur', 'Chitral',
    'Batagram', 'Daggar (Buner)', 'Alpuri (Shangla)', 'Lakki Marwat', 'Tank', 'Karak', 'Hangu',
    'Parachinar (Kurram)', 'Landi Kotal (Khyber)', 'Ghalanai (Mohmand)', 'Khar (Bajaur)',
    'Kalaya (Orakzai)', 'Miranshah (North Waziristan)', 'Wana (South Waziristan)', 'Topi',
    'Timergara (Lower Dir)', 'Dir (Upper Dir)', 'Batkhela (Malakand)', 'Zaida',
  ],
  Balochistan: [
    'Quetta', 'Gwadar', 'Turbat', 'Khuzdar', 'Sibi', 'Chaman', 'Zhob', 'Hub', 'Loralai',
    'Dera Murad Jamali', 'Dera Allah Yar', 'Usta Muhammad', 'Mastung', 'Kalat', 'Panjgur',
    'Pasni', 'Ormara', 'Nushki', 'Kharan', 'Kech', 'Lasbela', 'Dalbandin', 'Sui', 'Barkhan',
    'Kohlu', 'Musakhel', 'Jhal Magsi', 'Awaran', 'Washuk', 'Ziarat', 'Harnai', 'Duki',
    'Naseerabad',
  ],
  'Islamabad Capital Territory': ['Islamabad'],
  'Azad Jammu & Kashmir': [
    'Muzaffarabad', 'Mirpur', 'Rawalakot', 'Kotli', 'Bagh', 'Bhimber', 'Hattian Bala',
    'Athmuqam (Neelum)', 'Pallandri (Sudhanoti)', 'Forward Kahuta (Haveli)', 'Poonch',
  ],
  'Gilgit-Baltistan': [
    'Gilgit', 'Skardu', 'Karimabad (Hunza)', 'Khaplu (Ghanche)', 'Gahkuch (Ghizer)', 'Nagar',
    'Astore', 'Chilas (Diamer)', 'Shigar', 'Kharmang',
  ],
};
