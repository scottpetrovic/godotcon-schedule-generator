document.addEventListener('DOMContentLoaded', function() {
    // Path to your JSON file
    const jsonFilePath = 'schedule-data.json';
    
    // Fetch the JSON data
    fetch(jsonFilePath)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        renderSchedule(data);
      })
      .catch(error => {
        document.getElementById('loading').innerHTML = 'Error loading conference data. Please try again later.';
        console.error('There has been a problem with your fetch operation:', error);
      });
  });

  function renderSchedule(data) {

    // create legend data heading
    renderLegend(data.schedule.conference.tracks, 'legend');

    // Access the conference data
    const conference = data.schedule.conference;
    const primaryColor = conference.colors.primary;
    
    // Set conference title and dates
    document.getElementById('conference-title').textContent = conference.title;
    document.getElementById('conference-title').style.color = primaryColor;
    
    const startDate = parseLocalDate(conference.start);
    const endDate = parseLocalDate(conference.end);
    document.getElementById('conference-dates').textContent = formatDateRange(startDate, endDate);
    
    // Create a color map for tracks
    const trackColors = {};
    conference.tracks.forEach(track => {
      trackColors[track.name] = track.color;
    });
    
    // Render each day
    const daysContainer = document.getElementById('days-container');
    conference.days.forEach(day => {
      // Create day container
      const dayContainer = document.createElement('div');
      dayContainer.className = 'day-container';
      
      // Add day heading
      const dayHeading = document.createElement('h2');
      const dayDate = parseLocalDate(day.date);
      dayHeading.textContent = formatDay(dayDate);
      dayHeading.style.color = primaryColor;
      dayContainer.appendChild(dayHeading);
      
      // Create rooms container
      const roomsContainer = document.createElement('div');
      roomsContainer.className = 'rooms-container';
      
      // Add rooms for this day. Each one will be a column
      if (day.rooms) {
        Object.keys(day.rooms).forEach( (roomName, idx) => {
          const roomEvents = day.rooms[roomName];
          
          // Create room container
          const roomDiv = document.createElement('div');
          roomDiv.className = 'room';
          
          // Add room name
          const roomNameDiv = document.createElement('div');
          roomNameDiv.className = 'room-name';
          roomNameDiv.innerHTML = `${roomName} <span class="room-capacity">(${data.schedule.conference.rooms[idx].capacity} person capacity)</span>`;
          roomNameDiv.style.backgroundColor = primaryColor;
          roomNameDiv.style.color = 'white';
          roomDiv.appendChild(roomNameDiv);
          
          // Add events for this room
          roomEvents.forEach(event => {
            const eventDiv = document.createElement('div');
            eventDiv.className = 'event';
            
            // Add track indicator
            if (event.track && trackColors[event.track]) {
              const trackIndicator = document.createElement('div');
              trackIndicator.className = 'track-indicator';
              trackIndicator.style.backgroundColor = trackColors[event.track];
              eventDiv.appendChild(trackIndicator);
              eventDiv.style.paddingRight = '25px';
            }
            
            // Add event time
            const timeDiv = document.createElement('div');
            timeDiv.className = 'event-time';
            timeDiv.textContent =  `${formatTimeStringToAMPM(event.start)} `;
            
            // Add duration
            const durationSpan = document.createElement('span');
            durationSpan.className = 'duration';
            durationSpan.textContent = `${formatDuration(event.duration) }`;
            timeDiv.appendChild(durationSpan);
            
            eventDiv.appendChild(timeDiv);
            
            // Add title
            const titleDiv = document.createElement('div');
            titleDiv.className = 'event-title';
            titleDiv.textContent = event.title;
            eventDiv.appendChild(titleDiv);
            
            // Add event type
            if (event.type) {
              const typeDiv = document.createElement('div');
              typeDiv.className = 'event-type';
              typeDiv.textContent = `${event.track || ''} ${event.type}`.trim();

            if (event.type == "Workshop")
            {
              // Workshops have both type and track set to the same
              typeDiv.textContent = event.type; 
            }

              eventDiv.appendChild(typeDiv);
            }
            
            // Add presenter(s)
            if (event.persons && event.persons.length > 0) {
              const presenterDiv = document.createElement('div');
              presenterDiv.className = 'event-presenter';
              
              const presenters = event.persons.map(person => person.public_name).join(', ');
              presenterDiv.textContent = `Presenter${event.persons.length > 1 ? 's' : ''}: ${presenters}`;
              eventDiv.appendChild(presenterDiv);
            }
            
            // Add abstract
            if (event.abstract) {
              const abstractDiv = document.createElement('div');
              abstractDiv.className = 'event-abstract';
              abstractDiv.textContent = cleanAbstractData(event.abstract);
              eventDiv.appendChild(abstractDiv);
            }
            
            roomDiv.appendChild(eventDiv);
          });
          
          roomsContainer.appendChild(roomDiv);
        });
      }
      
      dayContainer.appendChild(roomsContainer);
      daysContainer.appendChild(dayContainer);
    });
    
    // Hide loading and show schedule
    document.getElementById('loading').style.display = 'none';
    document.getElementById('schedule-container').style.display = 'block';
  }

  function formatDateRange(startDate, endDate) {
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    if (startDate.getFullYear() === endDate.getFullYear() && 
        startDate.getMonth() === endDate.getMonth()) {
      return `${startDate.toLocaleDateString('en-US', { month: 'long' })} ${startDate.getDate()}-${endDate.getDate()}, ${startDate.getFullYear()}`;
    } else {
      return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
    }
  }

  function formatDay(date) {
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  // purpose: Parse a date string in the format YYYY-MM-DD and return a Date object
  // This takes a local time date string and converts it to a Date object...fixing the timezone issue
  // Note: This function assumes the date string is in the format YYYY-MM-DD
  function parseLocalDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-based
  }

  // Start times for events are like 9:00, or 14:30
  // This function converts them to a 12-hour format with AM/PM for easier reading
  function formatTimeStringToAMPM(timeString) {
    const [hour, minute] = timeString.split(':').map(Number);
    const date = new Date(); // today’s date
    date.setHours(hour, minute, 0, 0); // set time

    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  // duratio for a talk is like 1:30, or 0:45
  function formatDuration(durationString) {
    const [hours, minutes] = durationString.split(':').map(Number);
    const parts = [];

    if (hours > 0) parts.push(`${hours} hr${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} min`);

    return parts.join(' ');
  }

  // Abstract/overview data can either be very long, or have some funky formatting that we will remove
  function cleanAbstractData(abstract) {
    // truncate data if it is over x characters. Some people write a lot in this abstract field
    let characterLimit = 700;
    if (abstract.length > characterLimit) {
      abstract = abstract.substring(0, characterLimit) + '...';
    }

    // remove all # symbols
    abstract = abstract.replace(/#/g, '');

    return abstract
  }


  function renderLegend(tracks, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = ''; // Clear anything existing

    tracks.forEach(track => {
      const item = document.createElement('div');
      item.className = 'legend-item';

      const colorBox = document.createElement('div');
      colorBox.className = 'legend-color';
      colorBox.style.backgroundColor = track.color;

      const label = document.createElement('span');
      label.textContent = track.name;

      item.appendChild(colorBox);
      item.appendChild(label);
      container.appendChild(item);
    });


}

