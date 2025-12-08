import { supabase } from '../supabase';
import type { User, CreateUser } from '../types';
import { handleDatabaseError } from './errors';

// ============= USERS =============
export async function getTrainerTrainees(trainerId: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('trainer_id', trainerId)
    .eq('role', 'trainee')
    .order('created_at', { ascending: false });

  if (error) handleDatabaseError('getTrainerTrainees', error);
  return data || [];
}

// Optimized function to get trainees with their plans and last workout in one go
export interface TraineeWithDetails {
  id: string;
  name: string;
  email: string;
  created_at: string;
  planActive: boolean;
  planName: string | null;
  lastWorkout: string | null;
}

export async function getTrainerTraineesWithDetails(trainerId: string): Promise<TraineeWithDetails[]> {
  try {
    // 1. Get all trainees of the trainer
    const { data: traineesList, error: traineesError } = await supabase
      .from('users')
      .select('id, name, email, created_at')
      .eq('trainer_id', trainerId)
      .eq('role', 'trainee')
      .order('created_at', { ascending: false });

    if (traineesError) handleDatabaseError('getTrainerTraineesWithDetails (trainees)', traineesError);
    if (!traineesList || traineesList.length === 0) {
      return [];
    }

    const traineeIds = traineesList.map(t => t.id);

    // 2. Get all active plans for these trainees in one query
    const { data: activePlans, error: plansError } = await supabase
      .from('workout_plans')
      .select('trainee_id, name')
      .in('trainee_id', traineeIds)
      .eq('is_active', true);

    if (plansError) {
      console.error('Error fetching plans:', plansError);
      // Continue without plans if error
    }

    // 3. Get the most recent workout log for each trainee
    const { data: recentLogs, error: logsError } = await supabase
      .from('workout_logs')
      .select('user_id, date')
      .in('user_id', traineeIds)
      .order('date', { ascending: false });

    if (logsError) {
      console.error('Error fetching logs:', logsError);
      // Continue without logs if error
    }

    // 4. Merge data in memory (much faster than network requests)
    const mergedData: TraineeWithDetails[] = traineesList.map(trainee => {
      const plan = activePlans?.find(p => p.trainee_id === trainee.id);
      const lastLog = recentLogs?.find(l => l.user_id === trainee.id);

      return {
        id: trainee.id,
        name: trainee.name,
        email: trainee.email,
        created_at: trainee.created_at,
        planActive: !!plan,
        planName: plan?.name || null,
        lastWorkout: lastLog?.date || null,
      };
    });

    return mergedData;
  } catch (error) {
    handleDatabaseError('getTrainerTraineesWithDetails', error);
  }
}

export async function createTrainee(trainee: CreateUser): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .insert(trainee)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUser(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}



