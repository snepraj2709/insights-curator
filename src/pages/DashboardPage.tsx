import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Dashboard from "@/components/Dashboard";

const DashboardPage = () => {
  const navigate = useNavigate();
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  useEffect(() => {
    // Get topics from localStorage
    const topics = localStorage.getItem('selectedTopics');
    if (topics) {
      setSelectedTopics(JSON.parse(topics));
    } else {
      // Redirect to onboarding if no topics selected
      navigate('/onboarding');
    }
  }, [navigate]);

  if (selectedTopics.length === 0) {
    return null; // Will redirect
  }

  return <Dashboard selectedTopics={selectedTopics} />;
};

export default DashboardPage;
