type DeepPartial<Obj> = Obj extends object
  ? {
      [Key in keyof Obj]?: DeepPartial<Obj[Key]>;
    }
  : Obj;

const actualGithub = await import("@actions/github");
type Octokit = ReturnType<typeof actualGithub.getOctokit>;
export type PullGetPartialResponse = DeepPartial<
  Awaited<ReturnType<Octokit["rest"]["pulls"]["get"]>>
>;
export type PullSearchPartialResponse = DeepPartial<
  Awaited<ReturnType<Octokit["rest"]["search"]["issuesAndPullRequests"]>>
>;
