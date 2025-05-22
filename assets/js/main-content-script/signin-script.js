
            document.addEventListener('alpine:init', () => {
                Alpine.data('scrollToTop', () => ({
                    showTopButton: false,
                    init() {
                        window.onscroll = () => {
                            this.scrollFunction();
                        };
                    },
                    scrollFunction() {
                        if (document.body.scrollTop > 50 || document.documentElement.scrollTop > 50) {
                            this.showTopButton = true;
                        } else {
                            this.showTopButton = false;
                        }
                    },
                    goToTop() {
                        document.body.scrollTop = 0;
                        document.documentElement.scrollTop = 0;
                    },
                }));

                Alpine.data('auth', () => ({
                    userName: '',
                    password: '',
                    subscribe: false,
                    languages: [
                        { id: 1, key: 'Chinese', value: 'zh' },
                        { id: 2, key: 'Danish', value: 'da' },
                        { id: 3, key: 'English', value: 'en' },
                        { id: 4, key: 'French', value: 'fr' },
                        { id: 5, key: 'German', value: 'de' },
                        { id: 6, key: 'Greek', value: 'el' },
                        { id: 7, key: 'Hungarian', value: 'hu' },
                        { id: 8, key: 'Italian', value: 'it' },
                        { id: 9, key: 'Japanese', value: 'ja' },
                        { id: 10, key: 'Polish', value: 'pl' },
                        { id: 11, key: 'Portuguese', value: 'pt' },
                        { id: 12, key: 'Russian', value: 'ru' },
                        { id: 13, key: 'Spanish', value: 'es' },
                        { id: 14, key: 'Swedish', value: 'sv' },
                        { id: 15, key: 'Turkish', value: 'tr' },
                        { id: 16, key: 'Arabic', value: 'ae' },
                    ],
                    async loginUser() {
                        if (!this.userName || typeof this.userName !== 'string') {
                            alert('Username must be a non-empty string.');
                            return;
                        }
                        if (!this.password) {
                            alert('Password cannot be empty.');
                            return;
                        }

                        try {
                            const response = await fetch('http://192.168.3.74:3001/auth/login', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ userName: this.userName, password: this.password }),
                            });

                            const data = await response.json();
                            console.log('Response Status:', response.status);
                            console.log('Response Data:', data);

                           if (response.ok) {
    const { token, user } = data;

    localStorage.setItem('token', token);
    localStorage.setItem('role', user.role);
    localStorage.setItem('permissions', JSON.stringify(user.permissions));
    localStorage.setItem('userName', user.userName); // ✅ Add this line

    window.location.href = 'index.html';
}else {
                                console.error('Login failed:', data.message);
                                alert(data.message || 'Login failed. Please check your credentials.');
                            }
                        } catch (error) {
                            console.error('Error during login:', error);
                            alert('An error occurred. Please try again later.');
                        }
                    },
                }));
            });

            // Redirect to index.html if already logged in
            (function () {
                const token = localStorage.getItem('token');
                if (token) {
                    console.log('Token found, redirecting to index.html');
                    window.location.href = 'index.html';
                }
            })();

