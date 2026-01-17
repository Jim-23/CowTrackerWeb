const user_id = '12345'; // Local user_id for debugging
const localToken = `secret${user_id}`;

// Making a request using the token
fetch('http://localhost:3001/resource', {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${localToken}`, // Bearer token with "secret12345"
    },
})
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));
