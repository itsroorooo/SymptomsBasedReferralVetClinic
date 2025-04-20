// components/clinic/PatientList.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';

const PatientList = ({ clinicId }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        
        const { data, error: queryError } = await supabase
          .from('appointments')
          .select(`
            id,
            pet: pets (
              id,
              name,
              pet_type,
              breed,
              age,
              color,
              photo_url,
              weight,
              owner: owner_id (
                id,
                email,
                profile: pet_owner_profiles (
                  first_name,
                  last_name,
                  contact_number
                )
              )
            ),
            appointment_date,
            status
          `)
          .eq('clinic_id', clinicId)
          .order('appointment_date', { ascending: false });

        if (queryError) throw queryError;

        // Process data to get unique pets
        const uniquePets = {};
        data.forEach(appointment => {
          if (appointment.pet && !uniquePets[appointment.pet.id]) {
            uniquePets[appointment.pet.id] = {
              ...appointment.pet,
              last_appointment: appointment.appointment_date,
              appointment_status: appointment.status
            };
          }
        });

        setPatients(Object.values(uniquePets));
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    if (clinicId) {
      fetchPatients();
    }
  }, [clinicId]);

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.owner?.profile?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.owner?.profile?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

 
  if (error) return <div className="text-red-500 text-center py-8">Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Clinic Patients</h1>
      
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search patients by name or owner..."
          className="w-full p-2 border rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredPatients.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No patients found for this clinic.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map(patient => (
            <div key={patient.id} className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
              <div className="p-4">
                <div className="flex items-center space-x-4 mb-4">
                  {patient.photo_url ? (
                    <img 
                      src={patient.photo_url} 
                      alt={patient.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-xl">
                        {patient.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-semibold">{patient.name}</h2>
                    <p className="text-gray-600 capitalize">{patient.breed || 'Unknown breed'}</p>
                    <p className="text-sm text-gray-500">
                      {patient.age ? `${patient.age} years old` : 'Age not specified'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Type:</span> {patient.pet_type}
                  </div>
                  <div>
                    <span className="font-medium">Color:</span> {patient.color || 'Not specified'}
                  </div>
                  <div>
                    <span className="font-medium">Weight:</span> {patient.weight ? `${patient.weight} kg` : 'Not specified'}
                  </div>
                  <div>
                    <span className="font-medium">Owner:</span> 
                    {patient.owner?.profile ? 
                      ` ${patient.owner.profile.first_name} ${patient.owner.profile.last_name}` : 
                      ' Unknown owner'}
                  </div>
                  <div>
                    <span className="font-medium">Last Visit:</span> 
                    {patient.last_appointment ? 
                      new Date(patient.last_appointment).toLocaleDateString() : 
                      ' No visits yet'}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      patient.appointment_status === 'completed' ? 'bg-green-100 text-green-800' :
                      patient.appointment_status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      patient.appointment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {patient.appointment_status || 'unknown'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex space-x-2">
                  <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
                    View Medical History
                  </button>
                  <button className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm">
                    Contact Owner
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientList;