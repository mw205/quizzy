document.addEventListener('DOMContentLoaded', () => {
    // Check which page we are on
    const registerForm = document.querySelector('form');
    const path = window.location.pathname;

    if (path.includes('register.html') && registerForm) {
        handleRegistration(registerForm);
        
        // Preview image on selection
        const profileInput = document.getElementById('profilePic');
        const profilePreview = document.getElementById('profilePreview');
        
        if (profileInput && profilePreview) {
            profileInput.addEventListener('change', function(e) {
                if (this.files && this.files[0]) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        profilePreview.src = e.target.result;
                    }
                    reader.readAsDataURL(this.files[0]);
                }
            });
        }
    }
});

function handleRegistration(form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = form.username.value;
        const password = form.password.value;
        const grade = form.grade.value;
        const mobile = form.mobilenumber.value;
        const profilePicInput = document.getElementById('profilePic');

        // Check if user already exists
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        if (users.find(u => u.username === username)) {
            alert('Username already exists!');
            return;
        }

        let profilePicBase64 = null;

        try {
            if (profilePicInput.files && profilePicInput.files[0]) {
                profilePicBase64 = await compressImage(profilePicInput.files[0]);
            }

            const newUser = {
                id: Date.now(),
                username,
                password,
                grade,
                mobile,
                role: 'student',
                profilePic: profilePicBase64 // Stores small Base64 string or null
            };

            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));

            alert('Registration successful! Please login.');
            window.location.href = '../index.html';

        } catch (error) {
            console.error("Error saving user:", error);
            alert("An error occurred during registration.");
        }
    });
}


function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Set fixed thumbnail size
                const maxWidth = 150;
                const maxHeight = 150;
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions while maintaining aspect ratio
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to Base64 with low quality (0.7) JPEG
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };

            img.onerror = (err) => reject(err);
        };

        reader.onerror = (err) => reject(err);
    });
}
