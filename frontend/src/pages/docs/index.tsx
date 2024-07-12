

import Container from 'components/Container';
import React from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerDocs = () => {
  return (
    <Container>
      <SwaggerUI url="docs.yaml" />
    </Container>
  )
}

export default SwaggerDocs;