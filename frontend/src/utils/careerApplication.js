export function createCareerForm() {
  const employer = () => ({ name: '', address: '', email: '', phone: '', secondary_email: '', job_title: '', responsibilities: '', from: '', to: '', reason_for_leaving: '', starting_pay: '', starting_pay_type: '', ending_pay: '', ending_pay_type: '' })
  const reference = () => ({ name: '', company: '', email: '', relationship: '', title: '', phone: '' })
  return {
    personal: { full_name: '', address: '', city: '', state: '', phone_number: '', email: '', position: '', date_available: '', desired_pay: '', pay_type: '', employment_desired: '', ssn: '', date_of_birth: '' },
    availability: { days: Object.fromEntries(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => [day, { available: false, start: '', end: '' }])), days_preference: false, nights_preference: false },
    employment_eligibility: { legally_eligible: '', previously_employed: '', previous_start_date: '', previous_end_date: '', driver_license: '', driver_license_number: '', driver_license_state: '', felony_conviction: '', felony_explanation: '' },
    education: {
      high_school: { name: '', city_state: '', from: '', to: '', graduated: '', diploma: '' },
      college: { name: '', city_state: '', from: '', to: '', graduated: '', diploma: '' },
      other_education_1: { name: '', city_state: '', from: '', to: '', degree: '' },
      other_education_2: { name: '', city_state: '', from: '', to: '', degree: '' },
    },
    employers: [employer(), employer(), employer()],
    references: [reference(), reference(), reference()],
    military: { veteran: '', branch: '', rank_at_discharge: '', from: '', to: '', type_of_discharge: '', discharge_explanation: '' },
    additional: { background_check_consent: '', drug_test_consent: '', additional_information: '', disability: '', hispanic_latino: '', race_categories: [] },
    certification: { signature: '', printed_name: '', date: '', accepted: false },
  }
}

export function careerApplicationAnswers(form) {
  return { ...structuredClone(form), demo: form.certification.accepted === true }
}
