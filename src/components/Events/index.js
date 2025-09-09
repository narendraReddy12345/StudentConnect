import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import Lottie from 'lottie-react';
import eventAnimation from '../../assets/fuGIip804B.json';
import PaymentButton from '../../components/PaymentButton'; // Import the PaymentButton component
import './Events.css';

// Import icons
import { 
  IoSearch, 
  IoCalendar,
  IoLocation,
  IoPricetag,
  IoClose,
  IoArrowForward,
  IoPeople,
  IoCheckmarkCircle,
  IoAlertCircle,
  IoArrowBack,
  IoFilter
} from 'react-icons/io5';

const CampusEvents = () => {
  const history = useHistory();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [setRegistrationSuccess] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [registrationStep, setRegistrationStep] = useState('form'); // 'form', 'payment', 'complete'
  const [currentRegistration, setCurrentRegistration] = useState(null);
  const [registrationData, setRegistrationData] = useState({
    name: '',
    email: '',
    phone: '',
    studentId: '',
    department: ''
  });

  const eventTypes = [
    'Technical Workshop',
    'Hackathon',
    'Cultural Festival',
    'Sports Event',
    'Seminar',
    'Conference',
    'Webinar',
    'Competition',
    'Exhibition',
    'Guest Lecture'
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'events'));
      const eventsData = [];
      querySnapshot.forEach((doc) => {
        eventsData.push({ id: doc.id, ...doc.data() });
      });
      // Sort events by date (newest first)
      eventsData.sort((a, b) => new Date(a.date) - new Date(b.date));
      setEvents(eventsData);
      setFilteredEvents(eventsData);
    } catch (error) {
      console.error("Error fetching events: ", error);
    }
  };

  const filterEvents = useCallback(() => {
    let results = events;
    
    // Filter by search query
    if (searchQuery) {
      results = results.filter(event => 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by category
    if (activeCategory !== 'All') {
      results = results.filter(event => event.type === activeCategory);
    }
    
    // Only show upcoming events
    results = results.filter(event => isEventUpcoming(event.date));
    
    setFilteredEvents(results);
  }, [searchQuery, activeCategory, events]);

  useEffect(() => {
    filterEvents();
  }, [filterEvents]);

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleRegisterClick = () => {
    setShowRegistrationModal(true);
    setShowEventModal(false);
    setRegistrationStep('form');
    setRegistrationData({
      name: '',
      email: '',
      phone: '',
      studentId: '',
      department: ''
    });
  };

  const handleRegistrationChange = (e) => {
    setRegistrationData({
      ...registrationData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    setIsRegistering(true);
    
    try {
      // Create registration record in Firebase
      const registrationRef = await addDoc(collection(db, 'registrations'), {
        eventId: selectedEvent.id,
        eventTitle: selectedEvent.title,
        ...registrationData,
        paymentStatus: selectedEvent.isPaid ? 'pending' : 'not_required',
        registeredAt: serverTimestamp()
      });

      // If event is paid, move to payment step
      if (selectedEvent.isPaid) {
        setRegistrationStep('payment');
        setCurrentRegistration({
          id: registrationRef.id,
          ...registrationData
        });
      } else {
        // Free event - registration complete
        setRegistrationStep('complete');
        setRegistrationSuccess(true);
      }
    } catch (error) {
      console.error("Error registering for event: ", error);
      alert('Registration failed. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handlePaymentSuccess = async (paymentResponse) => {
    try {
      // Update registration with payment details
      await updateDoc(doc(db, 'registrations', currentRegistration.id), {
        paymentStatus: 'paid',
        paymentId: paymentResponse.razorpay_payment_id,
        paymentDate: new Date()
      });
      
      // Create payment record
      await addDoc(collection(db, 'payments'), {
        eventId: selectedEvent.id,
        eventTitle: selectedEvent.title,
        studentId: currentRegistration.studentId,
        studentName: currentRegistration.name,
        registrationId: currentRegistration.id,
        amount: selectedEvent.price || 0,
        paymentId: paymentResponse.razorpay_payment_id,
        status: 'completed',
        createdAt: new Date()
      });
      
      setRegistrationStep('complete');
      setRegistrationSuccess(true);
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Payment successful but registration update failed. Please contact support.');
    }
  };

  const handlePaymentError = (errorMessage) => {
    alert(`Payment error: ${errorMessage}`);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getEventIcon = (type) => {
    switch(type) {
      case 'Technical Workshop': return '🔧';
      case 'Hackathon': return '💻';
      case 'Cultural Festival': return '🎭';
      case 'Sports Event': return '⚽';
      case 'Seminar': return '📚';
      case 'Conference': return '👔';
      case 'Webinar': return '📹';
      case 'Competition': return '🏆';
      case 'Exhibition': return '🖼️';
      case 'Guest Lecture': return '🎤';
      default: return '📅';
    }
  };

  const isEventUpcoming = (eventDate) => {
    return new Date(eventDate) >= new Date();
  };

  const getDaysUntilEvent = (eventDate) => {
    const today = new Date();
    const eventDay = new Date(eventDate);
    const diffTime = eventDay - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;
    if (diffDays < 30) return `In ${Math.ceil(diffDays / 7)} weeks`;
    return `In ${Math.ceil(diffDays / 30)} months`;
  };

  return (
    <div className="eventHorizon">
      {/* Header with back button */}
      <div className="navigateBackContainer">
        <button onClick={() => history.goBack()} className="orbitBackButton">
          <IoArrowBack size={24} />
        </button>
        <h1 className="stellarTitle">Campus Events</h1>
        <div className="headerSpacer"></div>
      </div>

      {/* Search Section */}
      <div className="cosmosSearch">
        <div className="nebulaSearchBar">
          <IoSearch className="searchPulsar" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="searchQuasar"
          />
          {searchQuery && (
            <button 
              className="clearSupernova"
              onClick={() => setSearchQuery('')}
            >
              <IoClose />
            </button>
          )}
        </div>
        
        <button 
          className="filterComet"
          onClick={() => setShowFilters(!showFilters)}
        >
          <IoFilter />
          Filter
        </button>
      </div>

      {/* Filter Section */}
      {showFilters && (
        <div className="galaxyFilters">
          <div className="filterCluster">
            <span className="filterNebula">Event Types</span>
            <div className="constellationOptions">
              <button 
                className={activeCategory === 'All' ? 'activeStar' : 'starOption'}
                onClick={() => setActiveCategory('All')}
              >
                All Events
              </button>
              {eventTypes.map(type => (
                <button
                  key={type}
                  className={activeCategory === type ? 'activeStar' : 'starOption'}
                  onClick={() => setActiveCategory(type)}
                >
                  {getEventIcon(type)} {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="eventUniverse">
        <div className="cosmicHeader">
          <h2 className="solarTitle">Upcoming Events</h2>
          <span className="eventMeteorCount">{filteredEvents.length}</span>
        </div>
        
        {filteredEvents.length === 0 ? (
          <div className="voidState">
            <Lottie animationData={eventAnimation} loop={true} className="voidAnimation" />
            <p className="emptyNebula">
              {searchQuery || activeCategory !== 'All' 
                ? 'No events match your search' 
                : 'No upcoming events. Check back later!'}
            </p>
            {(searchQuery || activeCategory !== 'All') && (
              <button 
                className="resetOrbitButton"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('All');
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="eventGalaxy">
            {filteredEvents.map(event => (
              <div key={event.id} className="eventPlanet" onClick={() => handleEventClick(event)}>
                {event.imageURL && (
                  <div className="planetImage">
                    <img src={event.imageURL} alt={event.title} />
                    <div className="eventOrbitBadge">
                      {getDaysUntilEvent(event.date)}
                    </div>
                  </div>
                )}
                
                <div className="planetContent">
                  <div className="planetType">{getEventIcon(event.type)} {event.type}</div>
                  <h3 className="planetTitle">{event.title}</h3>
                  
                  <div className="planetMetadata">
                    <div className="moonData">
                      <IoCalendar className="moonIcon" />
                      <span>{formatDate(event.date)}{event.time && ` • ${event.time}`}</span>
                    </div>
                    
                    {event.venue && (
                      <div className="moonData">
                        <IoLocation className="moonIcon" />
                        <span>{event.venue}</span>
                      </div>
                    )}
                    
                    <div className="moonData">
                      <IoPricetag className="moonIcon" />
                      <span className={event.isPaid ? 'paidCrater' : 'freeCrater'}>
                        {event.isPaid ? `Paid Event • ₹${event.price}` : 'Free Event'}
                      </span>
                    </div>
                  </div>
                  
                  <button className="viewOrbitButton">
                    View Details <IoArrowForward />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      {showEventModal && selectedEvent && (
        <div className="modalBlackHole" onClick={() => setShowEventModal(false)}>
          <div className="eventSingularity" onClick={(e) => e.stopPropagation()}>
            <button className="singularityClose" onClick={() => setShowEventModal(false)}>
              <IoClose />
            </button>
            
            {selectedEvent.imageURL && (
              <div className="singularityImage">
                <img src={selectedEvent.imageURL} alt={selectedEvent.title} />
                <div className="singularityTime">
                  {getDaysUntilEvent(selectedEvent.date)}
                </div>
              </div>
            )}
            
            <div className="singularityContent">
              <div className="singularityType">{getEventIcon(selectedEvent.type)} {selectedEvent.type}</div>
              <h2>{selectedEvent.title}</h2>
              
              <div className="singularityMetadata">
                <div className="singularityData">
                  <IoCalendar className="dataPulsar" />
                  <div>
                    <div className="dataNebula">Date & Time</div>
                    <div className="dataQuasar">
                      {formatDate(selectedEvent.date)}{selectedEvent.time && ` • ${selectedEvent.time}`}
                    </div>
                  </div>
                </div>
                
                {selectedEvent.venue && (
                  <div className="singularityData">
                    <IoLocation className="dataPulsar" />
                    <div>
                      <div className="dataNebula">Venue</div>
                      <div className="dataQuasar">{selectedEvent.venue}</div>
                    </div>
                  </div>
                )}
                
                <div className="singularityData">
                  <IoPricetag className="dataPulsar" />
                  <div>
                    <div className="dataNebula">Registration</div>
                    <div className="dataQuasar">
                      {selectedEvent.isPaid ? `Paid Event • ₹${selectedEvent.price}` : 'Free Event'}
                    </div>
                  </div>
                </div>
                
                {selectedEvent.contactInfo && (
                  <div className="singularityData">
                    <IoPeople className="dataPulsar" />
                    <div>
                      <div className="dataNebula">Contact</div>
                      <div className="dataQuasar">{selectedEvent.contactInfo}</div>
                    </div>
                  </div>
                )}
              </div>
              
              {selectedEvent.description && (
                <div className="singularityDescription">
                  <h3>About this event</h3>
                  <p>{selectedEvent.description}</p>
                </div>
              )}
              
              <div className="singularityActions">
                <button className="registerNova" onClick={handleRegisterClick}>
                  Register for this Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {showRegistrationModal && selectedEvent && (
        <div className="modalBlackHole" onClick={() => {
          setShowRegistrationModal(false);
          setRegistrationStep('form');
        }}>
          <div className="registrationSingularity" onClick={(e) => e.stopPropagation()}>
            <button className="singularityClose" onClick={() => {
              setShowRegistrationModal(false);
              setRegistrationStep('form');
            }}>
              <IoClose />
            </button>
            
            {registrationStep === 'complete' ? (
              <div className="registrationSupernova">
                <IoCheckmarkCircle className="supernovaIcon" />
                <h2>Registration Successful!</h2>
                <p>You've successfully registered for {selectedEvent.title}</p>
                {selectedEvent.isPaid && <p>Your payment has been verified.</p>}
                <button 
                  className="closeButton"
                  onClick={() => {
                    setShowRegistrationModal(false);
                    setRegistrationStep('form');
                  }}
                >
                  Close
                </button>
              </div>
            ) : registrationStep === 'payment' ? (
              <div className="paymentStep">
                <div className="singularityHeader">
                  <h2>Complete Payment</h2>
                  <p>Please complete the payment to confirm your registration</p>
                </div>
                
                <div className="paymentDetails">
                  <div className="paymentSummary">
                    <h4>Order Summary</h4>
                    <div className="summaryItem">
                      <span>Event Registration</span>
                      <span>₹{selectedEvent.price}</span>
                    </div>
                    <div className="summaryItem">
                      <span>Convenience Fee</span>
                      <span>₹0</span>
                    </div>
                    <div className="summaryTotal">
                      <span>Total Amount</span>
                      <span>₹{selectedEvent.price}</span>
                    </div>
                  </div>
                  
                  <div className="studentInfo">
                    <h4>Student Details</h4>
                    <p><strong>Name:</strong> {currentRegistration.name}</p>
                    <p><strong>ID:</strong> {currentRegistration.studentId}</p>
                    <p><strong>Department:</strong> {currentRegistration.department}</p>
                  </div>
                </div>
                
                <div className="paymentActions">
                  <PaymentButton 
                    amount={selectedEvent.price}
                    eventName={selectedEvent.title}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                  
                  <button 
                    onClick={() => setRegistrationStep('form')}
                    className="backButton"
                  >
                    Back to Registration Form
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="singularityHeader">
                  <h2>Register for {selectedEvent.title}</h2>
                  <p>Please fill in your details to complete registration</p>
                </div>
                
                <form onSubmit={handleRegistrationSubmit} className="registrationOrbit">
                  <div className="orbitGroup">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={registrationData.name}
                      onChange={handleRegistrationChange}
                      required
                    />
                  </div>
                  
                  <div className="orbitGroup">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={registrationData.email}
                      onChange={handleRegistrationChange}
                      required
                    />
                  </div>
                  
                  <div className="orbitGroup">
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={registrationData.phone}
                      onChange={handleRegistrationChange}
                      required
                    />
                  </div>
                  
                  <div className="orbitGroup">
                    <label>Student ID *</label>
                    <input
                      type="text"
                      name="studentId"
                      value={registrationData.studentId}
                      onChange={handleRegistrationChange}
                      required
                    />
                  </div>
                  
                  <div className="orbitGroup">
                    <label>Department *</label>
                    <input
                      type="text"
                      name="department"
                      value={registrationData.department}
                      onChange={handleRegistrationChange}
                      required
                    />
                  </div>
                  
                  {selectedEvent.isPaid && selectedEvent.paymentQRURL && (
                    <div className="paymentAstral">
                      <IoAlertCircle className="astralIcon" />
                      <p>This is a paid event. Please complete payment to confirm your registration.</p>
                      <img src={selectedEvent.paymentQRURL} alt="Payment QR Code" className="astralQR" />
                    </div>
                  )}
                  
                  <button type="submit" disabled={isRegistering} className="submitOrbitButton">
                    {isRegistering ? 'Processing...' : (selectedEvent.isPaid ? 'Continue to Payment' : 'Complete Registration')}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CampusEvents;