import { useEffect } from 'react';

interface MetaTagManagerProps {
  title: string;
  description?: string;
}

const MetaTagManager: React.FC<MetaTagManagerProps> = ({ title, description }) => {
  useEffect(() => {
    // 1. Update the document title
    if (title) {
      document.title = title;
    }

    // 2. Update the meta description
    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]');
      
      // If the tag doesn't exist, create and append it
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      
      // Set the content of the description tag
      metaDescription.setAttribute('content', description);
    }
  }, [title, description]);

  // This component does not render anything to the DOM
  return null;
};

export default MetaTagManager;