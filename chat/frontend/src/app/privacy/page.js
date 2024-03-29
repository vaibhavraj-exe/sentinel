import React from "react";

const PrivacyPolicyPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-10 text-center">Privacy Policy</h1>
      <p className="mb-4">
        We value your privacy and are committed to protecting your personal
        information. This Privacy Policy outlines how we collect, use, and
        protect your information.
      </p>
      <h2 className="text-xl font-bold mb-2">Information Collection</h2>
      <p className="mb-4">
        We only collect the information that is absolutely necessary for the
        functionality of our services. This includes the following data:
        <ul className="list-disc ml-6">
          <li>Real-time Monitoring Data</li>
          <li>Profanity Detection Model Data</li>
          <li>Multiplatform Integration Data</li>
          <li>Link Analysis Module Data</li>
          <li>Explicit Image Detection Data</li>
          <li>... and more</li>
        </ul>
      </p>
      <h2 className="text-xl font-bold mb-2">Data Usage</h2>
      <p className="mb-4">
        We do not and will never share or sell your personal information for any
        purpose unless required by law. All information stored is temporary and
        will not be shared by any means.
      </p>
      <h2 className="text-xl font-bold mb-2">Opt-Out</h2>
      <p className="mb-4">
        If you choose not to disclose any information to us, your data will be
        automatically removed from our system when you stop using our service.
      </p>
      <h2 className="text-xl font-bold mb-2">Changes to Terms</h2>
      <p className="mb-4">
        We may update our Terms of Service and Privacy Policy from time to time.
        It is your responsibility to review these policies regularly.
      </p>
      <h2 className="text-xl font-bold mb-2">Message Payload Data</h2>
      <p>
        Our services may analyze message payloads for purposes such as profanity
        detection and content filtering. It's important to note that no
        user-specific information is extracted or stored during this process. We
        solely focus on the content of the messages to ensure a safe and
        appropriate online environment for all users.
      </p>
    </div>
  );
};

export default PrivacyPolicyPage;
