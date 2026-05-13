import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { MatchService } from '../match.service';
import { MATCH_NUMBER_EXTRACTION_DELAY } from '../consts/match.const';
import { Injectable } from '@nestjs/common';

@Injectable()
@Processor('matches')
export class MatchesConsumer {
  constructor(private readonly matchService: MatchService) {}

  @Process()
  async extractNumber(job: Job<unknown>) {
    const { match, roomId } = job.data as any;

    // Start the timer through the match service
    this.matchService.startTimer(match, roomId);

    return {};
  }
}
