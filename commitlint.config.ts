import { RuleConfigSeverity, type UserConfig } from '@commitlint/types';

const Configuration: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      RuleConfigSeverity.Error,
      'always',
      [
        'add',
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
        'perf',
      ],
    ],
    'header-max-length': async () => [0, 'always', 250],
    'body-max-length': async () => [0, 'always', 250],
    'body-max-line-length': async () => [0, 'always', 250],
    'subject-case': [RuleConfigSeverity.Error, 'always', 'lower-case'],
  },

  ignores: [(commit: string): boolean => commit.startsWith('merge')],

  defaultIgnores: true,

  helpUrl: 'https://gist.github.com/3bbaas/aef9538dd66945eee73215942251360f',
};

export default Configuration;
