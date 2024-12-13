document.addEventListener('DOMContentLoaded', function() {
    const userID = JSON.parse(document.getElementById('user_id').textContent);
    console.log(userID);
    const createLink = document.getElementById('create-link');
    const createPostModal = document.getElementById('create-post-modal');
    const postCreationModal = document.getElementById('post-creation-modal');
    const uploadButton = document.getElementById('upload-button');
    const imageUploadInput = document.getElementById('image-upload');
    const uploadedImage = document.getElementById('uploaded-image');
    const modalOverlay = document.getElementById('modal-overlay');
    const shareButton = document.getElementById('share-button');
    const captionInput = document.getElementById('caption-input');
    const loadingOverlay = document.getElementById('loaderOverlay');
    const uploadArea = document.getElementById('upload-area');

    // Show the create post modal when the user clicks the "Create" link
    createLink.addEventListener('click', function(event) {
      event.preventDefault(); // Prevent the default link behavior
      createPostModal.style.display = 'block';
      modalOverlay.style.display = 'block';
    });

    // Open file dialog when the button is clicked
    uploadButton.addEventListener('click', function() {
      imageUploadInput.click();
    });

    imageUploadInput.addEventListener('change', function(event) {
        const files = event.target.files;
        if (files.length > 0) {
            // Show the loading overlay
            loadingOverlay.style.display = 'flex';
            handleFileUpload({ target: { files } }); // Pass the files to the handler
        }
    });

    // Allow drag and drop functionality
    uploadArea.addEventListener('dragover', function(event) {
      event.preventDefault(); // Prevent default behavior
    });
    
    uploadArea.addEventListener('drop', function(event) {
      event.preventDefault(); // Prevent default behavior
      const files = event.dataTransfer.files;
      if (files.length > 0) {
        loadingOverlay.style.display = 'flex';
        handleFileUpload({ target: { files } }); // Pass the files to the handler
      }
    });

    // Add event listener to the share button
    shareButton.addEventListener('click', function() {
      submitPost(); // Call the submit function when the share button is clicked
    });

    // Function to handle file upload
    function handleFileUpload(event) {
      const file = event.target.files[0];
      if (file) {
        const formData = new FormData();
        formData.append('image', file); 
        
        // Send the image to the backend
        fetch('/posts/upload-image/', {
          method: 'POST',
          body: formData,
          headers: {
            'X-CSRFToken': getCookie('csrftoken'), // Include CSRF token for security
          },
        })
        .then(response => response.json())
        .then(data => {
          if (data.image_url) {
            uploadedImage.src = data.image_url; // Set the image source for preview
            createPostModal.style.display = 'none'; // Hide the create post modal
            postCreationModal.style.display = 'block'; // Show the post creation modal
            loadingOverlay.style.display = 'none';
          }
        })
        .catch(error => console.error('Error uploading image:', error));
      }
    }

    function openEditModal(post) {
        // Open the modal
        postCreationModal.style.display = 'block';
        modalOverlay.style.display = 'block';

        // Set up the fields in the modal with the post's existing data
        captionInput.value = post.content;  // Populate the caption input with the post's content

        // Update the uploaded image preview (if applicable)
         uploadedImage.src = post.image.replace(/^https?:\/\/[^\/]+/, '');

        // Optionally, you can store the post ID as a data attribute in the modal for later use
        postCreationModal.dataset.postId = post.id;
    }

    // Function to handle post submission
    function submitPost() {
        const fileInput = imageUploadInput.files[0]; // Get the image file from input
        const caption = captionInput.value; // Get the caption

        // If no new image was selected, and it's an edit, use the existing image
        const existingImageUrl = uploadedImage.src; // This will contain the URL of the uploaded image

        // If we are editing an existing post, we need the post ID from the modal's data attribute
        const postId = postCreationModal.dataset.postId;

        if (!caption) {
            alert("Please add a caption before submitting.");
            return;
        }

        // Create FormData to send the file (if any), user ID, and caption
        const formData = new FormData();
        formData.append('author', userID); 
        formData.append('title', 'POSTS');
        formData.append('content', caption); 

        if (fileInput) {
            // If a new file was selected, append it
            formData.append('image', fileInput);
        } else if (existingImageUrl && existingImageUrl !== uploadedImage.src) {
            // If no new file was selected, but we're editing, append the existing image URL
            formData.append('image', existingImageUrl); // Use the existing image URL
        }

        // Send the form data to the backend for either creation or updating a post
        const method = postId ? 'PUT' : 'POST'; // Use PUT if editing an existing post
        const url = postId ? `/posts/api/posts/${postId}/` : '/posts/api/posts/';

        fetch(url, {
            method: method,
            body: formData,
            headers: {
                'X-CSRFToken': getCookie('csrftoken'), // Include CSRF token for security
                // No need to set 'Content-Type' since FormData automatically sets the correct headers
            },
        })
        .then(response => {
            if (response.ok) {
                return response.json(); // Parse JSON response if successful
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        })
        .then(data => {
            alert('Post created/updated successfully!');
            postCreationModal.style.display = 'none'; // Hide the post creation modal
            modalOverlay.style.display = 'none'; // Hide the overlay

            location.reload(); // Reload the page or redirect if necessary
        })
        .catch(error => {
            console.error('Error creating/updating post:', error);
            alert('There was an issue creating/updating the post. Please try again.');
        })
        .finally(() => {
            loadingOverlay.style.display = 'none'; // Hide loading overlay once the fetch is complete
        });
    }

    // Function to get CSRF token for AJAX requests
    function getCookie(name) {
      let cookieValue = null;
      if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim();
          // Check if this cookie string begins with the name we want
          if (cookie.substring(0, name.length + 1) === (name + '=')) {
            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
            break;
          }
        }
      }
      return cookieValue;
    }

    // Go back to the previous modal when clicking back
    document.getElementById('back-button1').addEventListener('click', function() {
      postCreationModal.style.display = 'none';
      createPostModal.style.display = 'none';
      modalOverlay.style.display = 'none';
    });

    document.getElementById('back-button').addEventListener('click', function() {
      postCreationModal.style.display = 'none';
      createPostModal.style.display = 'none';
      modalOverlay.style.display = 'none';
    });

    const postsContainer = document.getElementById('posts-container');

    // Function to generate and insert post elements into the DOM
    function displayPosts(posts) {
      initializeLikeStatus(posts); 

      posts.forEach(post => {
        // Create the necessary HTML elements for a post
        const postElement = document.createElement('div');
        postElement.classList.add('post');

        const postHeader = document.createElement('div');
        postHeader.classList.add('post-header');
        // Create a span for the username
        const usernameSpan = document.createElement('span');
        usernameSpan.textContent = post.author.username;
        
        postHeader.appendChild(usernameSpan);

        const actionDiv = document.createElement('div');
        actionDiv.classList.add('action-div');

        postHeader.appendChild(actionDiv);

        if (post.author.id === userID) {
          const edit = document.createElement('i');
          edit.classList.add('fa-solid', 'fa-pencil');
          edit.style.color = "#171F2B";
          edit.style.cursor = "pointer";

          actionDiv.appendChild(edit);

          edit.addEventListener('click', function() {
                openEditModal(post);  // Call function to open the modal and populate it with post data
            });

          const trash = document.createElement('i');
          trash.classList.add('fa-solid', 'fa-trash-can');
          trash.style.color = "#FF0000";
          trash.style.cursor = "pointer";

          actionDiv.appendChild(trash);

          // Add click event to the ellipsis
          trash.addEventListener('click', function(event) {
              event.stopPropagation(); // Prevent the click from propagating to the document
              var decision = confirm("Are you sure you want to delete this post id: " + post.id);
              if (decision) {
                deletePost(post.id)
                location.reload()
              }
          });
        }
        
        // Process image URL to make it relative
        const relativeImageUrl = post.image.replace(/^https?:\/\/[^\/]+/, '');

        // Create main image
        const mainImage = document.createElement('img');
        mainImage.classList.add('main-image');
        mainImage.src = relativeImageUrl; // Use relative URL

        // Create blurred background image
        const blurredImage = document.createElement('img');
        blurredImage.classList.add('blurred-image');
        blurredImage.src = relativeImageUrl; // Use relative URL

        // Set up the post content
        const postContent = document.createElement('div');
        postContent.classList.add('post-content');

        const heartIcon = document.createElement('i');
        heartIcon.classList.add('fa-regular', 'fa-heart');
        heartIcon.id = `heart-icon-${post.id}`;
        heartIcon.style.color = "#171F2B";

        const likeCount = document.createElement('span');
        likeCount.classList.add('like-count');
        likeCount.id = `like-count-${post.id}`;

        postContent.appendChild(likeCount);
        postContent.appendChild(heartIcon);

        heartIcon.addEventListener('click', function() {
          toggleLike(post.id, heartIcon); // Call toggleLike function on click
        });
        
        const captionSpan = document.createElement('span');
        captionSpan.classList.add('image-caption');
        captionSpan.textContent = post.content;

        // Append elements to the post container
        postElement.appendChild(postHeader);
        postElement.appendChild(captionSpan);
        postElement.appendChild(blurredImage); 
        postElement.appendChild(mainImage); 
        postElement.appendChild(postContent);

        // Append the complete post element to the posts container
        postsContainer.appendChild(postElement);
      });
    }

    function toggleLike(postId, heartIconElement, likeCountElement) {
      const isLiked = heartIconElement.classList.contains('fa-solid');
      const postlikesid = heartIconElement.dataset.postlikesid || null;
  
      // Toggle icon locally to give immediate feedback
      if (isLiked) {
          heartIconElement.classList.remove('fa-solid');
          heartIconElement.classList.add('fa-regular');
      } else {
          heartIconElement.classList.remove('fa-regular');
          heartIconElement.classList.add('fa-solid');
      }
  
      // Determine API method (DELETE if unliking, POST if liking)
      const method = isLiked ? 'DELETE' : 'POST';
      const url = isLiked ? `/posts/api/postlikes/${postlikesid}/` : '/posts/api/postlikes/';
      const body = JSON.stringify({
        liked_by: userID,
        post_liked: postId
      });
  
      // Send request to create or delete like
      fetch(url, {
          method: method,
          headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': getCookie('csrftoken'), // CSRF token for security
          },
          body: body
      })
      .then(response => {
          if (!response.ok) {
              throw new Error(`Failed to toggle like for post ${postId}`);
          }
          // Only parse JSON if response has content (status is not 204)
          return response.status === 204 ? null : response.json();
      })
      .then(data => {
          if (data) {
              console.log(`Like ${isLiked ? 'deleted' : 'created'}:`, data);
          }
          // Refresh like count and icon status
          initializeLikeStatus([{ id: postId }]);
      })
      .catch(error => {
          console.error('Error toggling like:', error);
          // Revert icon state on error
          if (isLiked) {
              heartIconElement.classList.add('fa-solid');
              heartIconElement.classList.remove('fa-regular');
          } else {
              heartIconElement.classList.add('fa-regular');
              heartIconElement.classList.remove('fa-solid');
          }
      });
    }

    function deletePost(postId) {

        // The endpoint for deleting a post
        const deleteUrl = `/posts/api/posts/${postId}/`;

        // Send a DELETE request
        fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': getCookie('csrftoken'), // Include CSRF token for security
            },
        })
        .then(response => {
            if (response.ok) {
                console.log(`Post ${postId} deleted successfully`);
                // Remove the post from the DOM
                const postElement = document.getElementById(`post-${postId}`);
                if (postElement) {
                    postElement.remove();
                    location.reload()
                }
            } else {
                // Handle error responses
                console.error('Failed to delete post:', response.statusText);
                // You might want to show an error message to the user here
            }
        })
        .catch(error => {
            console.error('Error:', error);
            // Handle network errors or other exceptions
        });
    }

    function displayLikeCount(likeCountElement, count) {
      likeCountElement.textContent = count > 0 ? `${count}` : '';
    }

    function initializeLikeStatus(posts) {
      // Fetch the likes data for all posts
      fetch(`/posts/api/postlikes/?userId=${userID}`)
          .then(response => response.json())
          .then(likesData => {
              // Iterate over each post to set like status and like count
              posts.forEach(post => {
                  const heartIconElement = document.getElementById(`heart-icon-${post.id}`);
                  const likeCountElement = document.getElementById(`like-count-${post.id}`);
                  
                  // Filter likes to get only those for the current post
                  const postLikes = likesData.filter(like => like.post_liked && like.post_liked.id === post.id);
                
                  // Check if the current post is liked by the user
                  const isLikedByUser = postLikes.some(like => like.liked_by && like.liked_by.id === userID);
                  
                  // Update the heart icon based on whether the post is liked by the user
                  if (isLikedByUser) {
                    const userLike = postLikes.find(like => like.liked_by && like.liked_by.id === userID);
                      heartIconElement.classList.remove('fa-regular');
                      heartIconElement.classList.add('fa-solid');
                      heartIconElement.dataset.postlikesid = userLike.id;
                  } else {
                      heartIconElement.classList.remove('fa-solid');
                      heartIconElement.classList.add('fa-regular');
                      heartIconElement.dataset.postlikesid = '';
                  }
  
                  // Update the like count for the post
                  displayLikeCount(likeCountElement, postLikes.length);
              });
          })
          .catch(error => console.error('Error initializing like status:', error));
    }
  
    // Call the function to display posts
    fetch('/posts/api/posts/')
    .then(response => response.json())
    .then(posts => {
        displayPosts(posts);          // Call function to display posts
        initializeLikeStatus(posts);   // Initialize like status and counts for all posts
    })
    .catch(error => console.error('Error fetching posts:', error));
  });