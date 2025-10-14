import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopicSelector from "@/components/TopicSelector";

const Onboarding = () => {
  const navigate = useNavigate();

  const handleComplete = (topics: string[]) => {
    // Store topics in localStorage for demo purposes
    localStorage.setItem('selectedTopics', JSON.stringify(topics));
    navigate('/dashboard');
  };

  return <TopicSelector onComplete={handleComplete} />;
};

export default Onboarding;
