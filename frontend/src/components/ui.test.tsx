import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Badge, Button, Heading, InlineText, Paragraph, Surface, TextInput } from './ui';

describe('shared UI primitives', () => {
  it('preserves semantic elements and forwards native HTML props', () => {
    const markup = renderToStaticMarkup(
      <>
        <Heading level={2} id="page-title">Profile</Heading>
        <Paragraph aria-live="polite">Saved</Paragraph>
        <InlineText id="connection-state">Connected</InlineText>
        <Surface as="section" aria-label="Profile details">Details</Surface>
        <Badge variant="status" tone="success">Accepted</Badge>
        <Button type="submit" disabled aria-label="Save profile">Save</Button>
        <TextInput type="email" required aria-label="Email" />
      </>,
    );

    expect(markup).toContain('<h2 id="page-title">Profile</h2>');
    expect(markup).toContain('<p aria-live="polite">Saved</p>');
    expect(markup).toContain('<span id="connection-state">Connected</span>');
    expect(markup).toContain('<section');
    expect(markup).toContain('aria-label="Profile details"');
    expect(markup).toContain('<button');
    expect(markup).toContain('type="submit"');
    expect(markup).toContain('disabled=""');
    expect(markup).toContain('type="email"');
    expect(markup).toContain('required=""');
    expect(markup).toContain('aria-label="Email"');
  });
});
