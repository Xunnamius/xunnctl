/**
 * This file is used by JSDoc comments in fixture files so vanilla JS files can
 * have access to those delicious types. IRL, we'd be constructing the CLI
 * purely in TypeScript, but for testing purposes this will do.
 */

namespace Type {
  export type CliArgs = import('../../src/configure').CustomCliArguments;
  export type DummyArgs = { handled_by: string };
  export type ChildConfig =
    import('../../types/global').ChildConfiguration<DummyArgs>;
  export type ParentConfig =
    import('../../types/global').ParentConfiguration<DummyArgs>;
  export type RootConfig =
    import('../../types/global').RootConfiguration<DummyArgs>;
  export type ConfigModule =
    import('../../types/global').ImportedConfigurationModule<DummyArgs>;
}
