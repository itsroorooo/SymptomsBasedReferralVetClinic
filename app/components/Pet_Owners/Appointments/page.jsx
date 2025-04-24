import { useState, useEffect } from 'react';
import { createClient } from "@/utils/supabase/client";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Chip,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Button
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PetsIcon from '@mui/icons-material/Pets';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import ScheduleIcon from '@mui/icons-material/Schedule';

const AppointmentPage = () => {
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedAppointment, setExpandedAppointment] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchUserAndAppointments = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        
        setUser(user);
        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch basic appointment data first
        let { data, error: appointmentsError } = await supabase
          .from('appointments')
          .select(`
            id,
            appointment_date,
            start_time,
            end_time,
            status,
            created_at,
            clinic:clinic_id (
              id,
              clinic_name,
              address,
              city,
              province,
              contact_number
            ),
            pet:pet_id (
              id,
              name,
              pet_type,
              breed,
              age,
              photo_url
            ),
            consultation_id
          `)
          .eq('owner_id', user.id)
          .order('appointment_date', { ascending: false });

        if (appointmentsError) throw appointmentsError;

        // If we have appointments, fetch consultation details separately
        if (data && data.length > 0) {
          const consultationIds = data.map(appt => appt.consultation_id).filter(id => id);
          
          if (consultationIds.length > 0) {
            const { data: consultations, error: consultationError } = await supabase
              .from('pet_consultations')
              .select(`
                id,
                additional_info,
                status,
                consultation_symptoms (
                  symptom:symptom_id (
                    id,
                    name
                  )
                ),
                ai_diagnoses (
                  id,
                  possible_diagnosis,
                  created_at
                )
              `)
              .in('id', consultationIds);

            if (consultationError) throw consultationError;

            // Merge consultation data with appointments
            data = data.map(appt => ({
              ...appt,
              consultation: consultations?.find(c => c.id === appt.consultation_id) || null
            }));
          }
        }

        setAppointments(data || []);
      } catch (err) {
        console.error('Error:', err);
        setError(err.message || 'Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndAppointments();
  }, []);

  const handleAccordionChange = (appointmentId) => {
    setExpandedAppointment(expandedAppointment === appointmentId ? null : appointmentId);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (timeString) => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'completed':
        return 'primary';
      case 'declined':
      case 'cancelled':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (!user && !loading) {
    return (
      <Box p={3} textAlign="center">
        <Typography variant="h6">Please sign in to view appointments</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">Error loading appointments: {error}</Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Box>
    );
  }

  if (appointments.length === 0) {
    return (
      <Box p={3} textAlign="center">
        <Typography variant="h6">No appointment history found</Typography>
        <Typography variant="body1">You haven't made any appointments yet.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto', p: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Appointment History
      </Typography>
      
      <List sx={{ width: '100%' }}>
        {appointments.map((appointment) => (
          <Paper key={appointment.id} elevation={2} sx={{ mb: 2 }}>
            <Accordion
              expanded={expandedAppointment === appointment.id}
              onChange={() => handleAccordionChange(appointment.id)}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <CalendarTodayIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`Appointment for ${appointment.pet.name}`}
                    secondary={
                      <>
                        <Box component="span" display="block">
                          {formatDate(appointment.appointment_date)} • {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                        </Box>
                        <Box component="span" display="block">
                          {appointment.clinic.clinic_name}
                        </Box>
                      </>
                    }
                  />
                  <Chip
                    label={appointment.status}
                    color={getStatusColor(appointment.status)}
                    size="small"
                    sx={{ ml: 2 }}
                  />
                </ListItem>
              </AccordionSummary>
              
              <AccordionDetails>
                <Box sx={{ p: 2 }}>
                  {/* Pet Information */}
                  <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
                    <PetsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Pet Information
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {appointment.pet.photo_url ? (
                      <Avatar
                        src={appointment.pet.photo_url}
                        alt={appointment.pet.name}
                        sx={{ width: 80, height: 80, mr: 2 }}
                      />
                    ) : (
                      <Avatar sx={{ width: 80, height: 80, mr: 2, bgcolor: 'secondary.main' }}>
                        <PetsIcon />
                      </Avatar>
                    )}
                    <Box>
                      <Typography variant="body1">
                        <strong>Name:</strong> {appointment.pet.name}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Type:</strong> {appointment.pet.pet_type}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Breed:</strong> {appointment.pet.breed || 'Unknown'}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Age:</strong> {appointment.pet.age || 'Unknown'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  {/* Clinic Information */}
                  <Typography variant="h6" gutterBottom>
                    <BusinessIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Clinic Information
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1">
                      <strong>Clinic Name:</strong> {appointment.clinic.clinic_name}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Address:</strong> {appointment.clinic.address}, {appointment.clinic.city}, {appointment.clinic.province}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Contact:</strong> {appointment.clinic.contact_number}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  {/* Appointment Details */}
                  <Typography variant="h6" gutterBottom>
                    <ScheduleIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Appointment Details
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1">
                      <strong>Date:</strong> {formatDate(appointment.appointment_date)}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Time:</strong> {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Status:</strong> 
                      <Chip
                        label={appointment.status}
                        color={getStatusColor(appointment.status)}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                    <Typography variant="body1">
                      <strong>Booked on:</strong> {new Date(appointment.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                  
                  {appointment.consultation && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      
                      {/* Consultation Information */}
                      <Typography variant="h6" gutterBottom>
                        <MedicalServicesIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                        Consultation Details
                      </Typography>
                      
                      <Typography variant="body1" gutterBottom>
                        <strong>Additional Information:</strong> {appointment.consultation.additional_info || 'None provided'}
                      </Typography>
                      
                      {/* Symptoms */}
                      {appointment.consultation.consultation_symptoms?.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle1">
                            <strong>Reported Symptoms:</strong>
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                            {appointment.consultation.consultation_symptoms.map((symptomItem) => (
                              <Chip
                                key={symptomItem.symptom?.id || Math.random()}
                                label={symptomItem.symptom?.name || 'Unknown symptom'}
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                      
                      {/* AI Diagnoses */}
                      {appointment.consultation.ai_diagnoses?.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            <strong>Possible Diagnoses:</strong>
                          </Typography>
                          <List dense>
                            {appointment.consultation.ai_diagnoses.map((diagnosis) => (
                              <ListItem key={diagnosis.id}>
                                <ListItemText
                                  primary={typeof diagnosis.possible_diagnosis === 'object' 
                                    ? diagnosis.possible_diagnosis.diagnosis || 'Unknown diagnosis'
                                    : diagnosis.possible_diagnosis || 'Unknown diagnosis'}
                                  secondary={`Generated on ${new Date(diagnosis.created_at).toLocaleString()}`}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                    </>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Paper>
        ))}
      </List>
    </Box>
  );
};

export default AppointmentPage;